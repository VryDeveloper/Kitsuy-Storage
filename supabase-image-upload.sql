-- ============================================================
--  KitsuyStore — Upload de imagem do item (pedidos)
--  Execute no SQL Editor do Supabase
-- ============================================================

-- 1) Nova coluna na tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS image_url text;

-- 2) Bucket de storage para as imagens dos itens
--    (público para leitura, já que as fotos aparecem na tabela/preview)
insert into storage.buckets (id, name, public)
values ('order-images', 'order-images', true)
on conflict (id) do nothing;

-- 3) Políticas do bucket
--    Leitura pública (necessário para exibir as fotos no app)
create policy "public_read_order_images"
on storage.objects for select
using (bucket_id = 'order-images');

--    Upload/edição/remoção apenas por usuários autenticados
create policy "auth_users_insert_order_images"
on storage.objects for insert
with check (bucket_id = 'order-images' AND auth.role() = 'authenticated');

create policy "auth_users_update_order_images"
on storage.objects for update
using (bucket_id = 'order-images' AND auth.role() = 'authenticated');

create policy "auth_users_delete_order_images"
on storage.objects for delete
using (bucket_id = 'order-images' AND auth.role() = 'authenticated');

-- ============================================================
--  RESULTADO: qualquer pessoa pode VER as imagens (necessário
--  para elas aparecerem no app), mas só usuários autenticados
--  conseguem enviar, trocar ou remover.
-- ============================================================
