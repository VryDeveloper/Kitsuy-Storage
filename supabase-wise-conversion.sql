-- ============================================================
--  KitsuyStore — Etapa de conversão WISE no cálculo de preço
--  Execute no SQL Editor do Supabase
-- ============================================================

-- Novas colunas na tabela orders (auditoria da conversão JPY→BRL)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS purchase_price_yen numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS exchange_rate      numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wise_fee_percent   numeric;
