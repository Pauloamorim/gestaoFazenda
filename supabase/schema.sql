-- Cole tudo isso no SQL Editor do Supabase e clique em Run.

create table lotes (
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

create table animais (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lotes on delete cascade,
  identificacao text not null,
  caracteristicas text,
  peso_inicial numeric(7,2) check (peso_inicial > 0),
  idade_meses int check (idade_meses >= 0),
  criado_em timestamptz not null default now(),
  unique (lote_id, identificacao)
);

create table custos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lotes on delete cascade,
  categoria text not null,
  descricao text,
  data date not null,
  valor numeric(12,2) not null check (valor >= 0)
);

-- animal_id nulo = evento do lote inteiro (ex.: vacinação de todos)
create table eventos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lotes on delete cascade,
  animal_id uuid references animais on delete cascade,
  tipo text not null,
  descricao text,
  peso numeric(7,2) check (peso > 0),
  data date not null
);

create index on animais (lote_id);
create index on custos (lote_id);
create index on eventos (lote_id);

alter table lotes enable row level security;
alter table animais enable row level security;
alter table custos enable row level security;
alter table eventos enable row level security;

create policy "dono" on lotes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ponytail: mesma policy repetida nas 3 filhas; vira função se aparecer uma 4ª tabela
create policy "dono" on animais for all
  using (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()));

create policy "dono" on custos for all
  using (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()));

create policy "dono" on eventos for all
  using (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()));
