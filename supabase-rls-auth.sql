-- ============================================================
--  KitsuyStore — Políticas RLS com autenticação
--  Execute no SQL Editor do Supabase após configurar o Auth
-- ============================================================

-- Remove as políticas antigas (permissivas)
DROP POLICY IF EXISTS allow_all_clients ON clients;
DROP POLICY IF EXISTS allow_all_orders  ON orders;

-- Novas políticas: exige usuário autenticado
CREATE POLICY "auth_users_clients" ON clients
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_users_orders" ON orders
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
--  RESULTADO: apenas usuários logados conseguem
--  ler, criar, editar e deletar dados.
--  Quem não estiver autenticado recebe erro 403.
-- ============================================================
