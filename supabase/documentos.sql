-- Documentos do lote (GTA, nota fiscal, contrato…).
-- Rode isso no SQL Editor depois do schema.sql.

create table documentos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lotes on delete cascade,
  tipo text not null,
  descricao text,
  caminho text not null,          -- onde o arquivo está no bucket
  nome text not null,             -- nome original, o que o usuário vê
  tamanho int not null check (tamanho > 0),
  criado_em timestamptz not null default now()
);

create index on documentos (lote_id);
alter table documentos enable row level security;

create policy "dono" on documentos for all
  using (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()));

-- Bucket privado, 10 MB por arquivo, só PDF e imagem.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos', 'documentos', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- O arquivo mora em "<lote_id>/<uuid>-<nome>". A primeira pasta diz de quem é.
create policy "documentos do dono" on storage.objects for all
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from lotes l
      where l.id::text = (storage.foldername(name))[1] and l.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from lotes l
      where l.id::text = (storage.foldername(name))[1] and l.user_id = auth.uid()
    )
  );
