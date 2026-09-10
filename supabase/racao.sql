-- Formulação de ração: ingredientes e misturas, reaproveitáveis em qualquer lote.
-- Rode no SQL Editor depois de schema.sql e documentos.sql.

create table ingredientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (user_id, nome)
);

-- O preço é da compra, não do ingrediente: cada carga chega com um valor diferente.
-- O custo por kg de um ingrediente é a média ponderada das compras dele.
create table compras_ingrediente (
  id uuid primary key default gen_random_uuid(),
  ingrediente_id uuid not null references ingredientes on delete cascade,
  data date not null,
  quantidade numeric(12,3) not null check (quantidade > 0),   -- em kg
  valor_total numeric(12,2) not null check (valor_total >= 0),
  fornecedor text,
  observacoes text,
  criado_em timestamptz not null default now()
);

create table formulacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (user_id, nome)
);

create table formulacao_itens (
  id uuid primary key default gen_random_uuid(),
  formulacao_id uuid not null references formulacoes on delete cascade,
  -- restrict: não deixa apagar um ingrediente que ainda está em alguma mistura
  ingrediente_id uuid not null references ingredientes on delete restrict,
  quantidade numeric(10,3) not null check (quantidade > 0),
  unique (formulacao_id, ingrediente_id)
);

create index on compras_ingrediente (ingrediente_id);
create index on formulacao_itens (formulacao_id);
create index on formulacao_itens (ingrediente_id);

alter table ingredientes enable row level security;
alter table compras_ingrediente enable row level security;
alter table formulacoes enable row level security;
alter table formulacao_itens enable row level security;

create policy "dono" on ingredientes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dono" on compras_ingrediente for all
  using (exists (select 1 from ingredientes i where i.id = ingrediente_id and i.user_id = auth.uid()))
  with check (exists (select 1 from ingredientes i where i.id = ingrediente_id and i.user_id = auth.uid()));

create policy "dono" on formulacoes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dono" on formulacao_itens for all
  using (exists (select 1 from formulacoes f where f.id = formulacao_id and f.user_id = auth.uid()))
  with check (exists (select 1 from formulacoes f where f.id = formulacao_id and f.user_id = auth.uid()));
