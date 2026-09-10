import { cache } from 'react'
import { db, ok } from './supabase'
import { cabecasAtivas, custoMedio, gmdGeral, periodosDoLote, ultimoPreco } from './campos'

/** Mostra quanto cada consulta levou, só em desenvolvimento.
 *  ponytail: console.log resolve — se um dia precisar de histórico, aí sim OpenTelemetry. */
const medir = async <T>(nome: string, fn: () => Promise<T>): Promise<T> => {
  if (process.env.NODE_ENV === 'production') return fn()
  const t = performance.now()
  try {
    return await fn()
  } finally {
    console.log(`  ↳ banco: ${nome} ${(performance.now() - t).toFixed(0)}ms`)
  }
}

/** O custo por kg de um ingrediente é derivado das compras dele, nunca digitado. */
const comCusto = (i: any) => {
  const compras = i.compras_ingrediente ?? []
  const { kg, total, medio } = custoMedio(compras)
  return {
    ...i,
    compras,
    custo_kg: medio,
    kg_comprado: kg,
    total_gasto: total,
    ultimo: ultimoPreco(compras),
  }
}

/** Uma ida só ao banco: lote + animais + custos + eventos aninhados.
 *  ponytail: carrega o lote inteiro em vez de fatiar por aba — uma fazenda tem
 *  centenas de linhas, e cada ida ao Supabase custa uns 250ms. */
export const carregarLote = cache(async (id: string) =>
  medir('carregarLote', async () => {
    const sb = await db()
    const lote = ok(
      await sb
        .from('lotes')
        .select(
          '*, animais(*), custos(*), eventos(*, animais(identificacao)), documentos(*), saidas(*, animais(identificacao)), fornecimentos(*, formulacoes(id, nome)), compras_ingrediente(id, data, quantidade, valor_total, fornecedor, ingredientes(nome))',
        )
        .eq('id', id)
        .order('identificacao', { referencedTable: 'animais' })
        .order('data', { referencedTable: 'custos', ascending: false })
        .order('data', { referencedTable: 'eventos', ascending: false })
        .order('criado_em', { referencedTable: 'documentos', ascending: false })
      .order('data', { referencedTable: 'saidas', ascending: false })
      .order('inicio', { referencedTable: 'fornecimentos', ascending: false })
      .order('data', { referencedTable: 'compras_ingrediente', ascending: false })
        .maybeSingle(),
    )
    if (!lote) return null

    const { animais, custos, eventos, documentos, saidas, fornecimentos, compras_ingrediente } = lote as {
      animais: any[]
      custos: any[]
      eventos: any[]
      documentos: any[]
      saidas: any[]
      fornecimentos: any[]
      compras_ingrediente: any[]
    }

    // animal que morreu ou foi vendido não entra mais em média de peso nem em ganho
    const saiu = new Set(saidas.filter((s: any) => s.animal_id).map((s: any) => s.animal_id))
    const ativos = animais.filter((a: any) => !saiu.has(a.id))
    const cabecas = cabecasAtivas(lote.quantidade, saidas)
    const receita = saidas.reduce((s: number, x: any) => s + Number(x.valor_total ?? 0), 0)

    const gastosAvulsos = custos.reduce((s: number, c: any) => s + Number(c.valor), 0)
    const gastosIngredientes = compras_ingrediente.reduce(
      (s: number, c: any) => s + Number(c.valor_total),
      0,
    )
    const gastos = gastosAvulsos + gastosIngredientes
    const investido = Number(lote.custo_aquisicao) + Number(lote.frete) + gastos

    // eventos vêm do mais recente ao mais antigo; percorrer ao contrário deixa o último por cima
    const ultimoPeso = new Map<string, { peso: number; data: string }>()
    for (const e of [...eventos].reverse())
      if (e.animal_id && e.peso) ultimoPeso.set(e.animal_id, { peso: Number(e.peso), data: e.data })

    const pesos = ativos
      .map((a: any) => ultimoPeso.get(a.id)?.peso ?? Number(a.peso_inicial))
      .filter((p: number) => p > 0)
    const pesoMedio = pesos.length ? pesos.reduce((s: number, p: number) => s + p, 0) / pesos.length : 0

    const periodos = periodosDoLote(
      ativos,
      eventos
        .filter((e: any) => e.animal_id && e.peso)
        .map((e: any) => ({ animal_id: e.animal_id, data: e.data, peso: Number(e.peso) })),
      lote.data_chegada,
    )

    return {
      lote,
      animais,
      custos,
      compras: compras_ingrediente,
      eventos,
      documentos,
      gastos,
      investido,
      ultimoPeso,
      pesoMedio,
      periodos,
      gmdLote: gmdGeral(periodos),
      saidas,
      fornecimentos,
      ativos,
      cabecas,
      receita,
    }
  }),
)

export const listarLotes = cache(async () =>
  medir('listarLotes', async () => {
    const sb = await db()
    return ok(
      await sb
        .from('lotes')
        .select(
        'id, nome, data_chegada, quantidade, custo_aquisicao, frete, custos(valor), compras_ingrediente(valor_total), animais(id), saidas(quantidade)',
      )
        .order('data_chegada', { ascending: false }),
    )
  }),
)

export const totalLote = (l: any) =>
  Number(l.custo_aquisicao) +
  Number(l.frete) +
  (l.custos ?? []).reduce((s: number, c: any) => s + Number(c.valor), 0) +
  (l.compras_ingrediente ?? []).reduce((s: number, c: any) => s + Number(c.valor_total), 0)

export const listarIngredientes = cache(async () =>
  medir('listarIngredientes', async () => {
    const sb = await db()
    const linhas = ok(
      await sb
        .from('ingredientes')
        .select('*, compras_ingrediente(id, lote_id, data, quantidade, valor_total, fornecedor, lotes(id, nome))')
        .order('nome')
        .order('data', {
          referencedTable: 'compras_ingrediente',
          ascending: false,
        }),
    )
    return linhas.map(comCusto)
  }),
)

export const listarFormulacoes = cache(async () =>
  medir('listarFormulacoes', async () => {
    const sb = await db()
    const linhas = ok(
      await sb
        .from('formulacoes')
        .select(
          '*, formulacao_itens(quantidade, ingredientes(nome, compras_ingrediente(quantidade, valor_total)))',
        )
        .order('nome'),
    )
    return linhas.map((f: any) => ({
      ...f,
      formulacao_itens: f.formulacao_itens.map((i: any) => ({
        ...i,
        ingredientes: comCusto(i.ingredientes),
      })),
    }))
  }),
)

export const carregarFormulacao = cache(async (id: string) =>
  medir('carregarFormulacao', async () => {
    const sb = await db()
    const f = ok(
      await sb
        .from('formulacoes')
        .select(
          '*, formulacao_itens(id, quantidade, ingredientes(id, nome, compras_ingrediente(quantidade, valor_total)))',
        )
        .eq('id', id)
        .maybeSingle(),
    )
    if (!f) return null
    return {
      ...f,
      formulacao_itens: (f.formulacao_itens as any[]).map((i) => ({
        ...i,
        ingredientes: comCusto(i.ingredientes),
      })),
    }
  }),
)

export const cotacoesRecentes = cache(async (categoria: string) =>
  medir('cotacoes', async () => {
    const sb = await db()
    return ok(
      await sb
        .from('cotacoes')
        .select('*')
        .eq('categoria', categoria)
        .order('data', { ascending: false })
        .limit(120),
    )
  }),
)

/** Praças disponíveis, olhando todas as categorias. */
export const pracasConhecidas = cache(async () =>
  medir('pracas', async () => {
    const sb = await db()
    const linhas = ok(await sb.from('cotacoes').select('praca').order('praca').limit(2000))
    return [...new Set(linhas.map((l: any) => l.praca))] as string[]
  }),
)

/** Série histórica de uma praça, da mais antiga para a mais nova. */
export const historicoPraca = cache(async (categoria: string, praca: string) =>
  medir('historicoPraca', async () => {
    const sb = await db()
    return ok(
      await sb
        .from('cotacoes')
        .select('data, vista, prazo30, unidade')
        .eq('categoria', categoria)
        .eq('praca', praca)
        .order('data'),
    )
  }),
)

// ---------- equinos ----------

export const listarEquinos = cache(async () =>
  medir('listarEquinos', async () => {
    const sb = await db()
    return ok(
      await sb
        .from('equinos')
        .select(
          'id, nome, registro_abccmm, nascimento, sexo, funcao_reprodutiva, pelagem, andamento, dna_status, localizacao, situacao, valor_aquisicao, pai_id, mae_id, custos_equinos(valor)',
        )
        .order('nome'),
    )
  }),
)

export const listarReproducoesEquinas = cache(async () =>
  medir('listarReproducoesEquinas', async () => {
    const sb = await db()
    return ok(
      await sb
        .from('reproducoes_equinas')
        .select('*')
        .order('criado_em', { ascending: false }),
    )
  }),
)

export const listarLembretesEquinos = cache(async () =>
  medir('listarLembretesEquinos', async () => {
    const sb = await db()
    return ok(
      await sb
        .from('eventos_equinos')
        .select('id, equino_id, tipo, descricao, proxima_data, equinos(nome)')
        .not('proxima_data', 'is', null)
        .order('proxima_data')
        .limit(100),
    )
  }),
)

export const carregarEquino = cache(async (id: string) =>
  medir('carregarEquino', async () => {
    const sb = await db()
    const equino = ok(await sb.from('equinos').select('*').eq('id', id).maybeSingle())
    if (!equino) return null

    const idsPais = [equino.pai_id, equino.mae_id].filter(Boolean) as string[]
    const [paisResposta, eventosResposta, custosResposta, documentosResposta, fotosResposta, reproducoesResposta] =
      await Promise.all([
        idsPais.length
          ? sb
              .from('equinos')
              .select('id, nome, registro_abccmm, pai_id, mae_id')
              .in('id', idsPais)
          : Promise.resolve({ data: [], error: null }),
        sb.from('eventos_equinos').select('*').eq('equino_id', id).order('data', { ascending: false }),
        sb
          .from('custos_equinos')
          .select('*, reproducoes_equinas(estacao)')
          .eq('equino_id', id)
          .order('data', { ascending: false }),
        sb
          .from('documentos_equinos')
          .select('*')
          .eq('equino_id', id)
          .order('criado_em', { ascending: false }),
        sb
          .from('fotos_equinos')
          .select('*')
          .eq('equino_id', id)
          .order('principal', { ascending: false })
          .order('criado_em', { ascending: false }),
        sb
          .from('reproducoes_equinas')
          .select('*')
          .or(`matriz_id.eq.${id},garanhao_id.eq.${id},receptora_id.eq.${id},potro_id.eq.${id}`)
          .order('criado_em', { ascending: false }),
      ])

    const pais = ok(paisResposta as any) as any[]
    const idsAvos = [
      ...new Set(pais.flatMap((p: any) => [p.pai_id, p.mae_id]).filter(Boolean)),
    ] as string[]
    const avos = idsAvos.length
      ? ok(
          await sb
            .from('equinos')
            .select('id, nome, registro_abccmm')
            .in('id', idsAvos),
        )
      : []
    const eventos = ok(eventosResposta)
    const custos = ok(custosResposta)
    const documentos = ok(documentosResposta)
    const fotos = ok(fotosResposta)
    const reproducoes = ok(reproducoesResposta)
    const gastos = custos.reduce((s: number, c: any) => s + Number(c.valor), 0)

    return {
      equino,
      pai: pais.find((p: any) => p.id === equino.pai_id) ?? null,
      mae: pais.find((p: any) => p.id === equino.mae_id) ?? null,
      avos,
      eventos,
      custos,
      documentos,
      fotos,
      reproducoes,
      gastos,
      investido: Number(equino.valor_aquisicao) + gastos,
    }
  }),
)

export const totalEquino = (e: any) =>
  Number(e.valor_aquisicao) +
  (e.custos_equinos ?? []).reduce((s: number, c: any) => s + Number(c.valor), 0)
