-- Saídas do lote, fornecimento de ração e rendimento de carcaça.
-- Rode no SQL Editor depois dos outros arquivos.

-- Morte e venda são a mesma coisa: cabeça que sai do lote. A venda só traz
-- dinheiro junto. Uma tabela só evita contar cabeça duas vezes.
create table saidas (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lotes on delete cascade,
  data date not null,
  tipo text not null,                                   -- Venda, Morte, Roubo, Outro
  quantidade int not null check (quantidade > 0),
  peso_total numeric(12,2) check (peso_total > 0),      -- kg vivos que saíram
  valor_total numeric(12,2) check (valor_total >= 0),   -- receita; nulo quando não é venda
  animal_id uuid references animais on delete set null, -- quando o animal é identificado
  descricao text,
  criado_em timestamptz not null default now()
);

-- Quanto o lote come por dia de cada formulação, a partir de quando.
-- O histórico é o próprio conjunto de linhas: uma nova data substitui a anterior.
create table fornecimentos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lotes on delete cascade,
  formulacao_id uuid not null references formulacoes on delete restrict,
  inicio date not null,
  kg_dia numeric(10,3) not null check (kg_dia >= 0),    -- 0 = parou de fornecer
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (lote_id, formulacao_id, inicio)
);

create index on saidas (lote_id);
create index on fornecimentos (lote_id);

alter table saidas enable row level security;
alter table fornecimentos enable row level security;

create policy "dono" on saidas for all
  using (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()));

create policy "dono" on fornecimentos for all
  using (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lotes l where l.id = lote_id and l.user_id = auth.uid()));

-- Rendimento de carcaça: quanto do peso vivo vira arroba de carcaça.
-- 50% é o padrão de mercado para boi de corte.
alter table lotes add column rendimento numeric(5,2) not null default 50
  check (rendimento > 0 and rendimento <= 100);
