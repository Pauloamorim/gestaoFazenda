-- Galeria privada de fotos dos equinos.

create table public.fotos_equinos (
  id uuid primary key default gen_random_uuid(),
  equino_id uuid not null references public.equinos on delete cascade,
  caminho text not null unique,
  nome text not null,
  legenda text,
  tamanho int not null check (tamanho > 0),
  principal boolean not null default false,
  criado_em timestamptz not null default now()
);

create index fotos_equinos_equino_idx on public.fotos_equinos (equino_id, criado_em desc);
create unique index fotos_equinos_principal_idx on public.fotos_equinos (equino_id)
  where principal;

alter table public.fotos_equinos enable row level security;

create policy "dono" on public.fotos_equinos for all
  using (exists (
    select 1 from public.equinos e
    where e.id = equino_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.equinos e
    where e.id = equino_id and e.user_id = auth.uid()
  ));

grant select, insert, update, delete on table public.fotos_equinos to authenticated, service_role;

-- As imagens usam documentos/equinos/<equino_id>/fotos/...; a política privada
-- criada para os documentos do equino já autoriza esse caminho ao proprietário.
