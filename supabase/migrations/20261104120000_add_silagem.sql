-- Silagem: áreas de plantio, depósitos (quartinhos), produção/uso em sacos e custos.
-- O estoque não é gravado: é a soma dos movimentos de cada depósito.

create table public.silagem_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  cultura text not null,
  tamanho_ha numeric(8,2) check (tamanho_ha > 0),
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (user_id, nome)
);

create table public.silagem_depositos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (user_id, nome)
);

create table public.silagem_movimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  tipo text not null check (tipo in ('producao', 'uso', 'saldo_inicial')),
  data date not null,
  sacos int not null check (sacos > 0),
  deposito_id uuid not null references public.silagem_depositos on delete restrict,
  area_id uuid references public.silagem_areas on delete restrict,
  observacoes text,
  criado_em timestamptz not null default now(),
  -- só produção sai de uma área; uso e saldo inicial não têm origem no campo
  check ((tipo = 'producao') = (area_id is not null))
);

create table public.silagem_custos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  area_id uuid references public.silagem_areas on delete restrict,
  categoria text not null,
  descricao text,
  data date not null,
  valor numeric(12,2) not null check (valor > 0),
  criado_em timestamptz not null default now()
);

create index silagem_movimentos_user_data_idx on public.silagem_movimentos (user_id, data desc);
create index silagem_movimentos_deposito_idx on public.silagem_movimentos (deposito_id);
create index silagem_movimentos_area_idx on public.silagem_movimentos (area_id);
create index silagem_custos_user_data_idx on public.silagem_custos (user_id, data desc);
create index silagem_custos_area_idx on public.silagem_custos (area_id);

alter table public.silagem_areas enable row level security;
alter table public.silagem_depositos enable row level security;
alter table public.silagem_movimentos enable row level security;
alter table public.silagem_custos enable row level security;

create policy "dono" on public.silagem_areas for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dono" on public.silagem_depositos for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dono" on public.silagem_movimentos for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.silagem_depositos d
      where d.id = deposito_id and d.user_id = auth.uid()
    )
    and (
      area_id is null
      or exists (
        select 1 from public.silagem_areas a
        where a.id = area_id and a.user_id = auth.uid()
      )
    )
  );

create policy "dono" on public.silagem_custos for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      area_id is null
      or exists (
        select 1 from public.silagem_areas a
        where a.id = area_id and a.user_id = auth.uid()
      )
    )
  );

grant select, insert, update, delete on table
  public.silagem_areas,
  public.silagem_depositos,
  public.silagem_movimentos,
  public.silagem_custos
to authenticated, service_role;
