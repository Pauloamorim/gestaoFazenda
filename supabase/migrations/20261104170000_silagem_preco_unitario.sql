-- O preço do insumo é informado direto por unidade (ex.: R$ 2,00 o kg de milho),
-- em vez de "paguei X por Y". Linhas existentes são convertidas.

alter table public.silagem_insumos add column preco_unitario numeric(12,4);

update public.silagem_insumos set preco_unitario = round(valor_pago / qtd_comprada, 4);

alter table public.silagem_insumos
  alter column preco_unitario set not null,
  add constraint silagem_insumos_preco_unitario_check check (preco_unitario >= 0),
  drop column qtd_comprada,
  drop column valor_pago;
