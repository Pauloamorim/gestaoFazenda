-- Baseline do banco em 2026-08-18.
--
-- Projetos novos aplicam este arquivo normalmente com `supabase db push`.
-- Projetos que já receberam os antigos arquivos SQL manualmente devem marcar
-- esta versão como aplicada; veja supabase/README.md.

create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  quantidade int not null check (quantidade > 0),
  custo_aquisicao numeric(12,2) not null default 0 check (custo_aquisicao >= 0),
  frete numeric(12,2) not null default 0 check (frete >= 0),
  data_chegada date not null,
  observacoes text,
  criado_em timestamptz not null default now()
);

create table public.animais (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes on delete cascade,
  identificacao text not null,
  caracteristicas text,
  peso_inicial numeric(7,2) check (peso_inicial > 0),
  idade_meses int check (idade_meses >= 0),
  criado_em timestamptz not null default now(),
  unique (lote_id, identificacao)
);

create table public.custos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes on delete cascade,
  categoria text not null,
  descricao text,
  data date not null,
  valor numeric(12,2) not null check (valor >= 0)
);

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes on delete cascade,
  animal_id uuid references public.animais on delete cascade,
  tipo text not null,
  descricao text,
  peso numeric(7,2) check (peso > 0),
  data date not null
);

create index animais_lote_id_idx on public.animais (lote_id);
create index custos_lote_id_idx on public.custos (lote_id);
create index eventos_lote_id_idx on public.eventos (lote_id);

alter table public.lotes enable row level security;
alter table public.animais enable row level security;
alter table public.custos enable row level security;
alter table public.eventos enable row level security;

create policy "dono" on public.lotes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dono" on public.animais for all
  using (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()));

create policy "dono" on public.custos for all
  using (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()));

create policy "dono" on public.eventos for all
  using (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()));

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes on delete cascade,
  tipo text not null,
  descricao text,
  caminho text not null,
  nome text not null,
  tamanho int not null check (tamanho > 0),
  criado_em timestamptz not null default now()
);

create index documentos_lote_id_idx on public.documentos (lote_id);
alter table public.documentos enable row level security;

create policy "dono" on public.documentos for all
  using (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos', 'documentos', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "documentos do dono" on storage.objects for all
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.lotes l
      where l.id::text = (storage.foldername(name))[1] and l.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.lotes l
      where l.id::text = (storage.foldername(name))[1] and l.user_id = auth.uid()
    )
  );

create table public.ingredientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (user_id, nome)
);

create table public.compras_ingrediente (
  id uuid primary key default gen_random_uuid(),
  ingrediente_id uuid not null references public.ingredientes on delete cascade,
  data date not null,
  quantidade numeric(12,3) not null check (quantidade > 0),
  valor_total numeric(12,2) not null check (valor_total >= 0),
  fornecedor text,
  observacoes text,
  criado_em timestamptz not null default now()
);

create table public.formulacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (user_id, nome)
);

create table public.formulacao_itens (
  id uuid primary key default gen_random_uuid(),
  formulacao_id uuid not null references public.formulacoes on delete cascade,
  ingrediente_id uuid not null references public.ingredientes on delete restrict,
  quantidade numeric(10,3) not null check (quantidade > 0),
  unique (formulacao_id, ingrediente_id)
);

create index compras_ingrediente_ingrediente_id_idx on public.compras_ingrediente (ingrediente_id);
create index formulacao_itens_formulacao_id_idx on public.formulacao_itens (formulacao_id);
create index formulacao_itens_ingrediente_id_idx on public.formulacao_itens (ingrediente_id);

alter table public.ingredientes enable row level security;
alter table public.compras_ingrediente enable row level security;
alter table public.formulacoes enable row level security;
alter table public.formulacao_itens enable row level security;

create policy "dono" on public.ingredientes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dono" on public.compras_ingrediente for all
  using (exists (select 1 from public.ingredientes i where i.id = ingrediente_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.ingredientes i where i.id = ingrediente_id and i.user_id = auth.uid()));

create policy "dono" on public.formulacoes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dono" on public.formulacao_itens for all
  using (exists (select 1 from public.formulacoes f where f.id = formulacao_id and f.user_id = auth.uid()))
  with check (exists (select 1 from public.formulacoes f where f.id = formulacao_id and f.user_id = auth.uid()));

create table public.cotacoes (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  categoria text not null default 'novilha_gorda',
  praca text not null,
  vista numeric(10,2) not null check (vista > 0),
  prazo30 numeric(10,2) not null check (prazo30 > 0),
  unidade text not null default '@' check (unidade in ('@', 'kg')),
  fonte text not null,
  criado_em timestamptz not null default now(),
  unique (data, categoria, praca)
);

create index cotacoes_categoria_praca_data_idx on public.cotacoes (categoria, praca, data desc);
alter table public.cotacoes enable row level security;

create policy "ler" on public.cotacoes for select to authenticated using (true);
create policy "gravar" on public.cotacoes for insert to authenticated with check (true);

alter table public.lotes add column praca text;
alter table public.lotes add column categoria text;

create table public.saidas (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes on delete cascade,
  data date not null,
  tipo text not null,
  quantidade int not null check (quantidade > 0),
  peso_total numeric(12,2) check (peso_total > 0),
  valor_total numeric(12,2) check (valor_total >= 0),
  animal_id uuid references public.animais on delete set null,
  descricao text,
  criado_em timestamptz not null default now()
);

create table public.fornecimentos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes on delete cascade,
  formulacao_id uuid not null references public.formulacoes on delete restrict,
  inicio date not null,
  kg_dia numeric(10,3) not null check (kg_dia >= 0),
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (lote_id, formulacao_id, inicio)
);

create index saidas_lote_id_idx on public.saidas (lote_id);
create index fornecimentos_lote_id_idx on public.fornecimentos (lote_id);

alter table public.saidas enable row level security;
alter table public.fornecimentos enable row level security;

create policy "dono" on public.saidas for all
  using (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()));

create policy "dono" on public.fornecimentos for all
  using (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.lotes l where l.id = lote_id and l.user_id = auth.uid()));

alter table public.lotes add column rendimento numeric(5,2) not null default 50
  check (rendimento > 0 and rendimento <= 100);
