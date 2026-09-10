-- Cotações da novilha gorda, coletadas da Scot Consultoria.
-- Rode no SQL Editor depois dos outros arquivos.

create table cotacoes (
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

create index on cotacoes (categoria, praca, data desc);

-- Preço de mercado não é dado de ninguém: quem está logado lê e grava.
-- ponytail: sem user_id porque a cotação é a mesma para todo mundo.
alter table cotacoes enable row level security;

create policy "ler" on cotacoes for select to authenticated using (true);
create policy "gravar" on cotacoes for insert to authenticated with check (true);

-- Cada lote acompanha a praça da região dele.
alter table lotes add column praca text;

-- Boi gordo e vaca gorda também: cada lote diz qual categoria acompanha.
alter table lotes add column categoria text;
