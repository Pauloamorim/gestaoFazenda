-- Custos do plantel podem existir sem vínculo com um equino específico.
-- O user_id mantém a propriedade e o isolamento RLS desses lançamentos gerais.

alter table public.custos_equinos
  add column user_id uuid references auth.users on delete cascade;

update public.custos_equinos c
set user_id = e.user_id
from public.equinos e
where e.id = c.equino_id;

alter table public.custos_equinos
  alter column user_id set default auth.uid(),
  alter column user_id set not null,
  alter column equino_id drop not null;

drop policy "dono" on public.custos_equinos;

create policy "dono" on public.custos_equinos for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      equino_id is null
      or exists (
        select 1 from public.equinos e
        where e.id = equino_id and e.user_id = auth.uid()
      )
    )
    and (
      reproducao_id is null
      or exists (
        select 1 from public.reproducoes_equinas r
        where r.id = reproducao_id and r.user_id = auth.uid()
      )
    )
  );

create index custos_equinos_user_data_idx
  on public.custos_equinos (user_id, data desc);
