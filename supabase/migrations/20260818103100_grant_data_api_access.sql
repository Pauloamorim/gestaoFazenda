-- O Supabase atual não expõe novas tabelas automaticamente. Os primeiros SQLs
-- do projeto dependiam do comportamento antigo; explicitar os grants mantém
-- instalações novas e o storage RLS consistentes.

grant select, insert, update, delete on table
  public.lotes,
  public.animais,
  public.custos,
  public.eventos,
  public.documentos,
  public.ingredientes,
  public.compras_ingrediente,
  public.formulacoes,
  public.formulacao_itens,
  public.saidas,
  public.fornecimentos
to authenticated, service_role;

grant select, insert on table public.cotacoes to authenticated, service_role;
