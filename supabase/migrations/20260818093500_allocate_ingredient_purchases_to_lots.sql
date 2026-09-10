-- Uma compra de ingrediente pode ser apropriada diretamente a um lote.
-- Nulo preserva as compras antigas até o usuário escolher o destino correto.

alter table public.compras_ingrediente
  add column lote_id uuid references public.lotes on delete set null;

create index compras_ingrediente_lote_id_idx
  on public.compras_ingrediente (lote_id);

drop policy "dono" on public.compras_ingrediente;

create policy "dono" on public.compras_ingrediente for all
  using (
    exists (
      select 1 from public.ingredientes i
      where i.id = ingrediente_id and i.user_id = auth.uid()
    )
    and (
      lote_id is null
      or exists (
        select 1 from public.lotes l
        where l.id = lote_id and l.user_id = auth.uid()
      )
    )
  )
  with check (
    exists (
      select 1 from public.ingredientes i
      where i.id = ingrediente_id and i.user_id = auth.uid()
    )
    and (
      lote_id is null
      or exists (
        select 1 from public.lotes l
        where l.id = lote_id and l.user_id = auth.uid()
      )
    )
  );
