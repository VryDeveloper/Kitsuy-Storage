-- ============================================================
--  KitsuyStore — Comprovantes de pagamento (PDF / PNG / JPG)
--  Execute no SQL Editor do Supabase
--  ⚠️ Rode DEPOIS do supabase-security-hardening.sql
--     (usa a função is_staff() criada nele)
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.is_staff()') IS NULL THEN
    RAISE EXCEPTION 'Rode primeiro o supabase-security-hardening.sql';
  END IF;
END $$;

-- 1) Tabela principal de comprovantes
CREATE TABLE IF NOT EXISTS payment_receipts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  file_path       text NOT NULL,          -- caminho no bucket "payment-receipts"
  file_name       text NOT NULL,          -- nome original do arquivo
  file_type       text NOT NULL,          -- application/pdf, image/png, image/jpeg
  amount          numeric,                -- valor pago (opcional)
  payment_date    date,                   -- data do pagamento (opcional)
  notes           text,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text
);

-- 2) Vínculo comprovante ↔ cliente (obrigatório: pelo menos 1)
--    RESTRICT: não deixa apagar um cliente que tem comprovantes,
--    para nenhum comprovante ficar sem cliente.
CREATE TABLE IF NOT EXISTS payment_receipt_clients (
  receipt_id uuid NOT NULL REFERENCES payment_receipts(id) ON DELETE CASCADE,
  client_id  uuid NOT NULL REFERENCES clients(id)          ON DELETE RESTRICT,
  PRIMARY KEY (receipt_id, client_id)
);

-- 3) Vínculo comprovante ↔ pedido (opcional, um comprovante pode cobrir vários pedidos)
CREATE TABLE IF NOT EXISTS payment_receipt_orders (
  receipt_id uuid NOT NULL REFERENCES payment_receipts(id) ON DELETE CASCADE,
  order_id   uuid NOT NULL REFERENCES orders(id)           ON DELETE CASCADE,
  PRIMARY KEY (receipt_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_receipt_clients_client ON payment_receipt_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_receipt_orders_order   ON payment_receipt_orders(order_id);

-- 4) RLS: só a equipe (app_staff)
DO $$
DECLARE
  t   text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['payment_receipts', 'payment_receipt_clients', 'payment_receipt_orders'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    -- Remove qualquer política anterior (inclusive as da 1ª versão deste script)
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY staff_only ON public.%I FOR ALL TO authenticated
         USING (public.is_staff()) WITH CHECK (public.is_staff())', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- 5) Função para salvar comprovante + vínculos de uma vez só (atômico).
--    Se p_receipt_id for NULL cria; senão atualiza dados e vínculos.
--    Recusa qualquer comprovante sem cliente, e pedidos de outros clientes.
CREATE OR REPLACE FUNCTION save_payment_receipt(
  p_receipt_id   uuid,
  p_file_path    text,
  p_file_name    text,
  p_file_type    text,
  p_amount       numeric,
  p_payment_date date,
  p_notes        text,
  p_client_ids   uuid[],
  p_order_ids    uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  IF p_client_ids IS NULL OR cardinality(p_client_ids) = 0 THEN
    RAISE EXCEPTION 'O comprovante precisa ter pelo menos um cliente vinculado.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = ANY(COALESCE(p_order_ids, '{}'))
      AND o.client_id IS NOT NULL
      AND NOT (o.client_id = ANY(p_client_ids))
  ) THEN
    RAISE EXCEPTION 'Há pedidos vinculados que não pertencem aos clientes selecionados.';
  END IF;

  IF p_receipt_id IS NULL THEN
    INSERT INTO payment_receipts
      (file_path, file_name, file_type, amount, payment_date, notes, created_by, created_by_name)
    VALUES
      (p_file_path, p_file_name, p_file_type, p_amount, p_payment_date, p_notes,
       auth.uid(),
       COALESCE(NULLIF(auth.jwt() -> 'user_metadata' ->> 'name', ''), auth.jwt() ->> 'email'))
    RETURNING id INTO v_id;
  ELSE
    UPDATE payment_receipts
       SET amount = p_amount, payment_date = p_payment_date, notes = p_notes
     WHERE id = p_receipt_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Comprovante não encontrado.';
    END IF;
    DELETE FROM payment_receipt_clients WHERE receipt_id = v_id;
    DELETE FROM payment_receipt_orders  WHERE receipt_id = v_id;
  END IF;

  INSERT INTO payment_receipt_clients (receipt_id, client_id)
  SELECT DISTINCT v_id, unnest(p_client_ids);

  INSERT INTO payment_receipt_orders (receipt_id, order_id)
  SELECT DISTINCT v_id, unnest(COALESCE(p_order_ids, '{}'));

  RETURN v_id;
END;
$$;

-- 6) Bucket PRIVADO para os arquivos (comprovantes são dados sensíveis).
--    O app gera links temporários (assinados) para visualizar.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-receipts', 'payment-receipts', false, 10485760,
        ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "auth_users_select_receipts_files" ON storage.objects;  -- 1ª versão
DROP POLICY IF EXISTS "auth_users_insert_receipts_files" ON storage.objects;  -- 1ª versão
DROP POLICY IF EXISTS "auth_users_delete_receipts_files" ON storage.objects;  -- 1ª versão
DROP POLICY IF EXISTS "staff_select_receipts_files" ON storage.objects;
DROP POLICY IF EXISTS "staff_insert_receipts_files" ON storage.objects;
DROP POLICY IF EXISTS "staff_delete_receipts_files" ON storage.objects;

CREATE POLICY "staff_select_receipts_files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'payment-receipts' AND public.is_staff());
CREATE POLICY "staff_insert_receipts_files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-receipts' AND public.is_staff());
CREATE POLICY "staff_delete_receipts_files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'payment-receipts' AND public.is_staff());

-- 7) A função só pode ser chamada por usuários logados (e checa is_staff)
REVOKE ALL ON FUNCTION save_payment_receipt(uuid, text, text, text, numeric, date, text, uuid[], uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION save_payment_receipt(uuid, text, text, text, numeric, date, text, uuid[], uuid[]) TO authenticated;

-- ============================================================
--  RESULTADO: comprovantes só podem ser vistos/enviados pela
--  equipe (app_staff), sempre com pelo menos 1 cliente vinculado.
-- ============================================================
