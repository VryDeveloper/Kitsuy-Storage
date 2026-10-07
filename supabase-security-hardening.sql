-- ============================================================
--  KitsuyStore — Endurecimento de segurança
--  Execute no SQL Editor do Supabase.
--  Substitui o antigo supabase-rls-auth.sql.
--
--  O que este script faz:
--   1. Cria uma lista de "equipe" (app_staff). Só quem está nela
--      acessa os dados — não basta ter uma conta no Supabase.
--   2. Remove TODAS as políticas antigas de orders/clients/comprovantes
--      (incluindo as permissivas que deixavam tudo público) e
--      recria só a regra "apenas equipe".
--   3. Tira qualquer permissão do papel anônimo (sem login).
--   4. Restringe envio/remoção de arquivos no storage à equipe.
--
--  Pode ser executado mais de uma vez sem problema.
-- ============================================================

-- 1) Lista de usuários autorizados ------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_staff (
  user_id  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email    text,
  added_at timestamptz NOT NULL DEFAULT now()
);

-- Ninguém lê/edita essa tabela pela API; só pelo painel/SQL Editor.
ALTER TABLE public.app_staff ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_staff FROM anon, authenticated;

-- Função usada pelas políticas. SECURITY DEFINER para conseguir ler app_staff.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_staff WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- Autoriza as contas que JÁ EXISTEM e têm e-mail confirmado.
-- ⚠️ Confira a lista no fim do script e remova quem não for da equipe.
INSERT INTO public.app_staff (user_id, email)
SELECT id, email FROM auth.users WHERE email_confirmed_at IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 2) Políticas das tabelas -------------------------------------------------
DO $$
DECLARE
  t   text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'orders', 'clients',
    'payment_receipts', 'payment_receipt_clients', 'payment_receipt_orders'
  ] LOOP
    -- Tabelas de comprovantes podem ainda não existir
    CONTINUE WHEN to_regclass('public.' || t) IS NULL;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

    -- Apaga toda política existente (inclusive as permissivas esquecidas)
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY staff_only ON public.%I FOR ALL TO authenticated
         USING (public.is_staff()) WITH CHECK (public.is_staff())', t);

    -- Sem login = sem acesso nenhum, nem com política errada no futuro
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- 3) Storage -----------------------------------------------------------------
-- Fotos dos produtos: o bucket continua público para EXIBIR as imagens
-- (links aleatórios), mas listar/enviar/trocar/apagar fica só com a equipe.
DROP POLICY IF EXISTS "public_read_order_images"        ON storage.objects;
DROP POLICY IF EXISTS "auth_users_insert_order_images"  ON storage.objects;
DROP POLICY IF EXISTS "auth_users_update_order_images"  ON storage.objects;
DROP POLICY IF EXISTS "auth_users_delete_order_images"  ON storage.objects;
DROP POLICY IF EXISTS "staff_select_order_images"       ON storage.objects;
DROP POLICY IF EXISTS "staff_insert_order_images"       ON storage.objects;
DROP POLICY IF EXISTS "staff_update_order_images"       ON storage.objects;
DROP POLICY IF EXISTS "staff_delete_order_images"       ON storage.objects;

CREATE POLICY "staff_select_order_images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'order-images' AND public.is_staff());
CREATE POLICY "staff_insert_order_images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'order-images' AND public.is_staff());
CREATE POLICY "staff_update_order_images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'order-images' AND public.is_staff());
CREATE POLICY "staff_delete_order_images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'order-images' AND public.is_staff());

-- Comprovantes (bucket privado). Recriadas aqui caso o script de
-- comprovantes já tenha rodado com as regras antigas.
DROP POLICY IF EXISTS "auth_users_select_receipts_files" ON storage.objects;
DROP POLICY IF EXISTS "auth_users_insert_receipts_files" ON storage.objects;
DROP POLICY IF EXISTS "auth_users_delete_receipts_files" ON storage.objects;
DROP POLICY IF EXISTS "staff_select_receipts_files"      ON storage.objects;
DROP POLICY IF EXISTS "staff_insert_receipts_files"      ON storage.objects;
DROP POLICY IF EXISTS "staff_delete_receipts_files"      ON storage.objects;

CREATE POLICY "staff_select_receipts_files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'payment-receipts' AND public.is_staff());
CREATE POLICY "staff_insert_receipts_files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-receipts' AND public.is_staff());
CREATE POLICY "staff_delete_receipts_files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'payment-receipts' AND public.is_staff());

-- 4) Conferência -------------------------------------------------------------
-- Estas são as contas com acesso. Se aparecer alguém que não é da equipe:
--   DELETE FROM public.app_staff WHERE email = 'email@estranho.com';
-- Para dar acesso a alguém novo (depois de criar a conta no painel Auth):
--   INSERT INTO public.app_staff (user_id, email)
--   SELECT id, email FROM auth.users WHERE email = 'novo@email.com';
SELECT s.email, s.added_at, u.created_at AS conta_criada_em, u.last_sign_in_at AS ultimo_login
FROM public.app_staff s JOIN auth.users u ON u.id = s.user_id
ORDER BY u.created_at;
