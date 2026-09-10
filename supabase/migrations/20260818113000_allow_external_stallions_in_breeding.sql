-- Ciclos reprodutivos podem usar um garanhão do plantel ou somente seu nome.

alter table public.reproducoes_equinas
  alter column garanhao_id drop not null,
  add column garanhao_nome text,
  add constraint reproducoes_equinas_garanhao_identificado_check check (
    (garanhao_id is not null) <> (nullif(btrim(garanhao_nome), '') is not null)
  );

drop policy "dono" on public.reproducoes_equinas;

create policy "dono" on public.reproducoes_equinas for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.equinos e where e.id = matriz_id and e.user_id = auth.uid())
    and (garanhao_id is null or exists (select 1 from public.equinos e where e.id = garanhao_id and e.user_id = auth.uid()))
    and (receptora_id is null or exists (select 1 from public.equinos e where e.id = receptora_id and e.user_id = auth.uid()))
    and (potro_id is null or exists (select 1 from public.equinos e where e.id = potro_id and e.user_id = auth.uid()))
  );
