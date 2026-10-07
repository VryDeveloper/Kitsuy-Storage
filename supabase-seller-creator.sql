-- ============================================================
--  KitsuyStore — Vendedor do pedido + registro de quem criou
--  Execute no SQL Editor do Supabase
-- ============================================================

-- 1) Novas colunas na tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_name     text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_name text;

-- 2) Preenche "quem criou" automaticamente a partir do usuário logado.
--    Feito no banco (e não no navegador) para que não possa ser forjado,
--    e os valores ficam travados em edições posteriores.
CREATE OR REPLACE FUNCTION set_order_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by      := auth.uid();
    NEW.created_by_name := COALESCE(
      NULLIF(auth.jwt() -> 'user_metadata' ->> 'name', ''),
      auth.jwt() ->> 'email'
    );
  ELSE
    NEW.created_by      := OLD.created_by;
    NEW.created_by_name := OLD.created_by_name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_order_creator ON orders;
CREATE TRIGGER trg_set_order_creator
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_creator();

-- ============================================================
--  Pedidos antigos (criados antes desta migração) ficam com
--  created_by vazio e aparecem como "—" no sistema.
-- ============================================================
