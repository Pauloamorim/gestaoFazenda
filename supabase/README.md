# Migrações do banco

O schema agora é controlado pelos arquivos versionados de `migrations/`. Os SQLs
soltos na raiz desta pasta são o instalador e as correções usados antes desta
mudança; ficam preservados apenas como referência e **não devem mais ser rodados**.

## Primeira configuração local

Requisitos: Node.js, Docker e `npm install`.

```bash
npm run db:start
npm run db:reset
```

`db:reset` recria o banco local, aplica todas as migrações em ordem e depois
executa `seed.sql`. Ele apaga somente os dados do banco Supabase local.

Use as credenciais mostradas por `npm run db:start` em `.env.local` quando quiser
rodar a aplicação contra o banco local.

## Criar uma mudança

```bash
npm run db:new -- nome_curto_da_mudanca
```

Edite o arquivo criado em `migrations/`. Depois valide a história inteira:

```bash
npm run db:reset
npm run db:lint
npm run check
```

Não altere uma migração que já chegou a outro ambiente. Crie uma nova migração
para corrigir ou desfazer a mudança.

Se preferir editar o schema pelo Studio **local**, gere a diferença com:

```bash
npm run db:diff -- nome_curto_da_mudanca
```

Não faça mudanças de schema pelo Dashboard/SQL Editor remoto depois de adotar
este fluxo, porque elas não entram no histórico versionado.

## Ligar e publicar em um projeto novo

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npm run db:push:dry
npm run db:push
npm run db:status
```

O `db:push:dry` mostra o que será aplicado sem mudar o banco. O `db:push` aplica
somente versões ainda ausentes de `supabase_migrations.schema_migrations`.

## Adotar em um projeto que já rodou os SQLs antigos

Primeiro faça backup e confirme que o schema remoto já contém todas as tabelas
dos antigos `schema.sql`, `documentos.sql`, `racao.sql`, `cotacoes.sql` e
`saidas-fornecimentos.sql`. Depois ligue o projeto e marque apenas o baseline
como já aplicado:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase migration repair --status applied 20260818000000
npm run db:status
npm run db:push:dry
```

O comando `repair` só registra a versão no histórico; ele não executa o baseline
novamente nem altera os dados existentes. Revise o `dry-run` antes do primeiro
`db:push` real.

Se o banco remoto tiver alterações além dos SQLs antigos, não marque o baseline
às cegas: use `npx supabase db pull` para capturar a diferença e reconcilie os
schemas primeiro.
