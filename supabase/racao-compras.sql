-- SÓ RODE ISTO se você já tinha rodado a versão antiga do racao.sql, aquela em que
-- ingredientes tinha a coluna custo_kg. Começando do zero, o racao.sql atual já vem
-- com a tabela de compras e você não precisa deste arquivo.
--
-- ATENÇÃO: apaga a coluna ingredientes.custo_kg. Os preços digitados ali somem —
-- lance-os de novo como compras, que é onde passam a morar.

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

create index on compras_ingrediente (ingrediente_id);

alter table compras_ingrediente enable row level security;

create policy "dono" on compras_ingrediente for all
  using (exists (select 1 from ingredientes i where i.id = ingrediente_id and i.user_id = auth.uid()))
  with check (exists (select 1 from ingredientes i where i.id = ingrediente_id and i.user_id = auth.uid()));

alter table ingredientes drop column custo_kg;
