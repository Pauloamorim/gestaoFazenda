# Gestão Fazenda

Controle de lotes de gado e criação de equinos Mangalarga Marchador: reprodução,
genealogia, saúde, custos e documentos.

Stack: Next.js (App Router) + Supabase (Postgres + Auth) + Vercel. Sem servidor pra cuidar.

## 1. Banco (Supabase)

1. Crie um projeto grátis em https://supabase.com (região `South America (São Paulo)`).
2. Instale as dependências, autentique a CLI e publique as migrações versionadas:

   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF
   npm run db:push:dry
   npm run db:push
   ```

   O passo a passo para desenvolvimento local e para adotar um banco que já
   recebeu os antigos arquivos SQL está em [`supabase/README.md`](supabase/README.md).
3. **Authentication → Providers → Email**: mantenha ligado. Se quiser entrar sem
   confirmar e-mail, desligue *Confirm email* (só faça isso se o cadastro for só seu).
4. **Project Settings → API**: copie `Project URL` e a chave `publishable`.

## 2. Rodar local

```bash
cp .env.local.example .env.local   # cole a URL e a chave publishable
npm install
npm run dev                        # http://localhost:3000
```

Primeiro acesso: **Criar conta** na tela de login.

## 3. Publicar (Vercel)

```bash
git init -b main && git add -A && git commit -m "primeira versão"
git remote add origin https://github.com/Pauloamorim/gestaoFazenda.git
git push -u origin main
```

Em https://vercel.com → **Add New Project** → importe o repositório → em
*Environment Variables* cole `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → **Deploy**.

Depois, no Supabase: **Authentication → URL Configuration → Site URL** = a URL da Vercel.

Custo: R$ 0 nos planos grátis dos dois. Só passa disso com mais de 500 MB de banco.

## Como usar

- **Lotes** — cadastra o lote com quantidade, custo de aquisição, frete e data de chegada.
- Dentro do lote:
  - **Animais**: brinco/identificação, características, peso inicial, idade estimada.
  - **Custos**: categoria, descrição, data e valor (ração, vacina, veterinário…).
  - **Vacinar o lote inteiro**: vacina + data, vale para todos os animais.
  - **Pesagens e ocorrências**: por animal ou pro lote todo; o peso mais recente
    vira "peso atual" e o ganho aparece na tabela de animais.
  - **Documentos**: GTA, nota fiscal, contrato. PDF ou foto, até 10 MB por arquivo.
  - **Resumo**: **"vale a pena segurar mais um dia?"** — o valor que cada cabeça
    ganha por dia menos o que ela come por dia. Mais o ganho médio diário em gráfico
    e tabela, o preço da arroba no ciclo e a divisão dos custos por categoria.
  - **Custos**: lançamentos avulsos e o **fornecimento de ração** — quantos kg/dia
    o lote come de cada mistura. Trocou a quantidade, lança linha nova com a data:
    a anterior vira histórico e o consumo passado continua certo.
  - **Saídas e venda**: morte, venda ou perda. Desconta do rebanho, corrige o custo
    por cabeça e fecha a conta — receita realizada + o que resta no pasto (avaliado
    pela cotação) contra o total investido.
  - **Histórico**: linha do tempo do lote — chegada, manejo, custos e documentos
    juntos, do mais recente para o mais antigo.
  - **Ficha do animal**: clique no brinco em qualquer tabela. Mostra peso de entrada,
    peso atual, ganho total, **ganho médio diário**, o gráfico da evolução do peso,
    o intervalo entre cada pesagem e
    tudo que aconteceu com ele — inclusive as vacinas aplicadas no lote inteiro.
- **Equinos** — gestão individual do plantel Mangalarga Marchador:
  - cadastro ABCCMM, microchip, DNA, pelagem, andamento e situação;
  - pedigree de três gerações: vincule animais cadastrados ou informe somente o
    nome de pai e mãe externos, sem criar fichas desnecessárias;
  - ciclos reprodutivos com matriz/doadora, receptora e garanhão cadastrado ou
    externo informado apenas pelo nome;
  - monta natural, inseminação e transferência de embrião;
  - diagnóstico, previsão de parto e criação automática da ficha do produto ao nascer;
  - agenda de vacinas, exames, ferrageamento e prazo de comunicação de nascimento;
  - galeria privada de fotos, com legenda e escolha da foto de capa;
  - central de custos para ração, veterinário, medicamentos e outras despesas,
    com lançamento geral do plantel, individual ou rateado entre equinos selecionados;
  - custos por animal e por ciclo reprodutivo, documentos privados e histórico completo.
- **Ração** — independente dos lotes, serve para todos:
  - **Ingredientes**: nome e observações. O preço não fica aqui — fica em cada
    **compra** (data, quantidade, valor total, fornecedor), porque toda carga chega
    com um valor diferente. Cada compra é vinculada ao lote que recebeu o insumo e
    entra automaticamente no capital investido, no custo por cabeça e no histórico
    desse lote. O custo do ingrediente é a média ponderada das compras.
  - **Formulações**: sua batida, ingrediente por ingrediente. Mostra participação
    de cada um, custo médio por kg e custo por tonelada. Ingrediente sem compra
    lançada aparece marcado, para o custo não sair errado sem você perceber.

- **Cotações** — **boi gordo, novilha gorda e vaca gorda**, preço bruto por praça,
  coletados da [Scot Consultoria](https://www.scotconsultoria.com.br/cotacoes/) no botão
  "Buscar cotações de hoje" (as três de uma vez). Cada lote escolhe o que vende e a praça
  da região dele; o Resumo mostra quanto a arroba andou desde a chegada.

  O `robots.txt` da Scot libera `/cotacoes/`, mas eles vendem esse dado por assinatura —
  confira os termos de uso antes de depender disso. O leitor está isolado em
  `lib/cotacoes.ts` com teste em cima de uma cópia real da página: se o site mudar,
  o teste quebra e a coleta reclama, em vez de gravar número errado em silêncio.
  A página do boi gordo traz "Boi China a Prazo" antes da tabela que interessa, então o
  leitor escolhe a tabela pelo título "Mercado Físico", nunca pela posição. Se uma das
  três categorias falhar, as outras duas ainda são gravadas.

Os totais (investido, custo por cabeça, peso médio) são calculados sozinhos.

## Segurança

Row Level Security ligado em todas as tabelas: cada usuário só enxerga os próprios lotes
e equinos, mesmo se a chave publicável vazar. Login/senha é gerenciado pelo Supabase Auth.

O bucket de documentos é privado: os arquivos só saem por link assinado, gerado no
clique e válido por 1 minuto. A mesma regra de dono vale lá.

## Testes

```bash
npm run check   # leitura dos campos de formulário (vírgula decimal, obrigatórios)
```

## Migrações

```bash
npm run db:start                    # Supabase local (requer Docker)
npm run db:reset                    # recria e reaplica toda a história local
npm run db:new -- minha_mudanca     # cria uma migração com timestamp
npm run db:push:dry                 # prévia das migrações remotas pendentes
npm run db:push                     # publica as migrações pendentes
```

Migrações aplicadas nunca são editadas. Toda alteração de schema ganha um novo
arquivo em `supabase/migrations/`.
