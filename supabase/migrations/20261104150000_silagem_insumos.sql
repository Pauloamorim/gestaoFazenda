-- Custo da silagem passa a ser a composição de um saco (milho, saco, amarrilho...)
-- em vez de um livro de despesas. A tabela antiga só é removida se estiver vazia.

do $$
begin
  if exists (select 1 from public.silagem_custos) then
    raise exception 'silagem_custos tem lançamentos; migre-os antes de remover a tabela';
  end if;
end $$;

drop table public.silagem_custos;

create table public.silagem_insumos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  unidade text not null,
  qtd_comprada numeric(12,3) not null check (qtd_comprada > 0),
  valor_pago numeric(12,2) not null check (valor_pago >= 0),
  qtd_por_saco numeric(12,3) not null check (qtd_por_saco > 0),
  criado_em timestamptz not null default now(),
  unique (user_id, nome)
);

alter table public.silagem_insumos enable row level security;

create policy "dono" on public.silagem_insumos for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on table public.silagem_insumos to authenticated, service_role;
