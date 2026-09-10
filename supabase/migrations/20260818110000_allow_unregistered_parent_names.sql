-- Permite informar apenas o nome de um genitor externo, sem criar uma ficha de
-- animal de referência. O vínculo por id continua disponível para pedigrees completos.

alter table public.equinos
  add column pai_nome text,
  add column mae_nome text,
  add check (pai_id is null or pai_nome is null),
  add check (mae_id is null or mae_nome is null);
