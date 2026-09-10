-- Gestão individual e reprodutiva de equinos Mangalarga Marchador.

create table public.equinos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  registro_abccmm text,
  status_registro text not null default 'Sem registro'
    check (status_registro in ('Sem registro', 'Provisório', 'Definitivo')),
  microchip text,
  nascimento date,
  sexo text not null check (sexo in ('Macho', 'Fêmea')),
  funcao_reprodutiva text not null default 'Jovem'
    check (funcao_reprodutiva in ('Garanhão', 'Matriz / doadora', 'Receptora', 'Potro', 'Jovem', 'Castrado')),
  pelagem text,
  andamento text not null default 'Não avaliado'
    check (andamento in ('Marcha batida', 'Marcha picada', 'Não avaliado')),
  dna_status text not null default 'Não realizado'
    check (dna_status in ('Não realizado', 'Coletado', 'Em análise', 'Compatível', 'Incompatível')),
  criador text,
  proprietario text,
  valor_aquisicao numeric(12,2) not null default 0 check (valor_aquisicao >= 0),
  data_aquisicao date,
  localizacao text,
  situacao text not null default 'Ativo'
    check (situacao in ('Ativo', 'Vendido', 'Transferido', 'Falecido', 'Referência')),
  pai_id uuid constraint equinos_pai_id_fkey references public.equinos on delete set null,
  mae_id uuid constraint equinos_mae_id_fkey references public.equinos on delete set null,
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (user_id, registro_abccmm),
  unique (user_id, microchip),
  check (pai_id is null or pai_id <> id),
  check (mae_id is null or mae_id <> id),
  check (pai_id is null or mae_id is null or pai_id <> mae_id)
);

create table public.reproducoes_equinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  matriz_id uuid not null references public.equinos on delete restrict,
  garanhao_id uuid not null references public.equinos on delete restrict,
  receptora_id uuid references public.equinos on delete restrict,
  potro_id uuid references public.equinos on delete set null,
  estacao text not null,
  metodo text not null
    check (metodo in ('Monta natural', 'Inseminação artificial', 'Transferência de embrião', 'Outro')),
  status text not null default 'Planejada'
    check (status in ('Planejada', 'Coberta / inseminada', 'Aguardando diagnóstico', 'Prenhez confirmada', 'Vazia', 'Embrião não recuperado', 'Perda gestacional', 'Parto realizado', 'Cancelada')),
  data_cobertura date,
  data_coleta date,
  data_transferencia date,
  previsao_parto date,
  data_parto date,
  observacoes text,
  criado_em timestamptz not null default now(),
  check (matriz_id <> garanhao_id),
  check (receptora_id is null or receptora_id <> matriz_id),
  check (receptora_id is null or receptora_id <> garanhao_id)
);

create table public.eventos_equinos (
  id uuid primary key default gen_random_uuid(),
  equino_id uuid not null references public.equinos on delete cascade,
  reproducao_id uuid references public.reproducoes_equinas on delete set null,
  tipo text not null,
  data date not null,
  proxima_data date,
  descricao text,
  peso numeric(7,2) check (peso > 0),
  criado_em timestamptz not null default now()
);

create table public.custos_equinos (
  id uuid primary key default gen_random_uuid(),
  equino_id uuid not null references public.equinos on delete cascade,
  reproducao_id uuid references public.reproducoes_equinas on delete set null,
  categoria text not null,
  descricao text,
  data date not null,
  valor numeric(12,2) not null check (valor >= 0),
  criado_em timestamptz not null default now()
);

create table public.documentos_equinos (
  id uuid primary key default gen_random_uuid(),
  equino_id uuid not null references public.equinos on delete cascade,
  tipo text not null,
  descricao text,
  caminho text not null,
  nome text not null,
  tamanho int not null check (tamanho > 0),
  criado_em timestamptz not null default now()
);

create index equinos_user_situacao_idx on public.equinos (user_id, situacao);
create index equinos_pai_id_idx on public.equinos (pai_id);
create index equinos_mae_id_idx on public.equinos (mae_id);
create index reproducoes_equinas_matriz_idx on public.reproducoes_equinas (matriz_id);
create index reproducoes_equinas_garanhao_idx on public.reproducoes_equinas (garanhao_id);
create index reproducoes_equinas_receptora_idx on public.reproducoes_equinas (receptora_id);
create index reproducoes_equinas_previsao_idx on public.reproducoes_equinas (previsao_parto);
create index eventos_equinos_equino_data_idx on public.eventos_equinos (equino_id, data desc);
create index eventos_equinos_proxima_data_idx on public.eventos_equinos (proxima_data);
create index custos_equinos_equino_data_idx on public.custos_equinos (equino_id, data desc);
create index documentos_equinos_equino_idx on public.documentos_equinos (equino_id);

alter table public.equinos enable row level security;
alter table public.reproducoes_equinas enable row level security;
alter table public.eventos_equinos enable row level security;
alter table public.custos_equinos enable row level security;
alter table public.documentos_equinos enable row level security;

create policy "dono" on public.equinos for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "dono" on public.reproducoes_equinas for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.equinos e where e.id = matriz_id and e.user_id = auth.uid())
    and exists (select 1 from public.equinos e where e.id = garanhao_id and e.user_id = auth.uid())
    and (receptora_id is null or exists (select 1 from public.equinos e where e.id = receptora_id and e.user_id = auth.uid()))
    and (potro_id is null or exists (select 1 from public.equinos e where e.id = potro_id and e.user_id = auth.uid()))
  );

create policy "dono" on public.eventos_equinos for all
  using (exists (select 1 from public.equinos e where e.id = equino_id and e.user_id = auth.uid()))
  with check (
    exists (select 1 from public.equinos e where e.id = equino_id and e.user_id = auth.uid())
    and (reproducao_id is null or exists (select 1 from public.reproducoes_equinas r where r.id = reproducao_id and r.user_id = auth.uid()))
  );

create policy "dono" on public.custos_equinos for all
  using (exists (select 1 from public.equinos e where e.id = equino_id and e.user_id = auth.uid()))
  with check (
    exists (select 1 from public.equinos e where e.id = equino_id and e.user_id = auth.uid())
    and (reproducao_id is null or exists (select 1 from public.reproducoes_equinas r where r.id = reproducao_id and r.user_id = auth.uid()))
  );

create policy "dono" on public.documentos_equinos for all
  using (exists (select 1 from public.equinos e where e.id = equino_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.equinos e where e.id = equino_id and e.user_id = auth.uid()));

-- Arquivos em "equinos/<equino_id>/<uuid>-<nome>" usam o mesmo bucket privado.
create policy "documentos de equinos do dono" on storage.objects for all
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = 'equinos'
    and exists (
      select 1 from public.equinos e
      where e.id::text = (storage.foldername(name))[2] and e.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = 'equinos'
    and exists (
      select 1 from public.equinos e
      where e.id::text = (storage.foldername(name))[2] and e.user_id = auth.uid()
    )
  );

-- Projetos novos não expõem tabelas automaticamente à Data API.
grant select, insert, update, delete on table public.equinos to authenticated, service_role;
grant select, insert, update, delete on table public.reproducoes_equinas to authenticated, service_role;
grant select, insert, update, delete on table public.eventos_equinos to authenticated, service_role;
grant select, insert, update, delete on table public.custos_equinos to authenticated, service_role;
grant select, insert, update, delete on table public.documentos_equinos to authenticated, service_role;
