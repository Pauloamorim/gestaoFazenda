// Leitura de campos de formulário em pt-br (vírgula decimal).

export function texto(v: FormDataEntryValue | null | undefined): string | null {
  const s = String(v ?? '').trim()
  return s || null
}

export function obrigatorio(v: FormDataEntryValue | null | undefined, campo: string): string {
  const s = texto(v)
  if (!s) throw new Error(`Preencha o campo "${campo}".`)
  return s
}

/** "1234,50" -> 1234.5 ; "" -> null ; lixo -> erro.
 *  ponytail: sem separador de milhar — os inputs são type="number", que já entrega valor canônico. */
export function numero(v: FormDataEntryValue | null | undefined, campo: string): number | null {
  const s = String(v ?? '').trim()
  if (!s) return null
  const n = Number(s.replace(',', '.'))
  if (!Number.isFinite(n)) throw new Error(`Valor inválido em "${campo}".`)
  return n
}

export function numeroObrigatorio(v: FormDataEntryValue | null | undefined, campo: string): number {
  const n = numero(v, campo)
  if (n === null) throw new Error(`Preencha o campo "${campo}".`)
  return n
}

export const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const dia = (d: string) => d.split('-').reverse().join('/')

/** Data de hoje no fuso do Brasil (o servidor roda em UTC). */
export const hoje = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

/** 1536 -> "1,5 MB" */
export const tamanho = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`

/** Peso e custo de uma mistura a partir dos seus itens. */
export function calcularMistura(itens: { quantidade: number | string; ingredientes: { custo_kg: number | string } }[]) {
  const kg = itens.reduce((s, i) => s + Number(i.quantidade), 0)
  const custo = itens.reduce((s, i) => s + Number(i.quantidade) * Number(i.ingredientes.custo_kg), 0)
  return { kg, custo, custoKg: kg ? custo / kg : 0, custoTon: kg ? (custo / kg) * 1000 : 0 }
}

type Compra = { quantidade: number | string; valor_total: number | string; data?: string }

/** Custo médio ponderado: tudo que foi pago dividido por tudo que entrou.
 *  ponytail: não desconta o que já foi consumido — vira média do estoque
 *  se um dia houver baixa de estoque. */
export function custoMedio(compras: Compra[]) {
  const kg = compras.reduce((s, c) => s + Number(c.quantidade), 0)
  const total = compras.reduce((s, c) => s + Number(c.valor_total), 0)
  return { kg, total, medio: kg ? total / kg : 0 }
}

/** Preço por kg da compra mais recente (empate: a última da lista). */
export function ultimoPreco(compras: Compra[]) {
  const u = compras.reduce<Compra | null>(
    (a, c) => (!a || String(c.data ?? '') >= String(a.data ?? '') ? c : a),
    null,
  )
  return u ? Number(u.valor_total) / Number(u.quantidade) : 0
}

/** Dias entre duas datas ISO ("2026-03-01"). */
export const diasEntre = (de: string, ate: string) =>
  Math.round((Date.parse(ate) - Date.parse(de)) / 86_400_000)

/** Ganho médio diário em kg/dia — o número que diz se o lote está pagando a ração. */
export function ganhoDiario(inicial: number, atual: number, de: string, ate: string) {
  const dias = diasEntre(de, ate)
  return dias > 0 ? (atual - inicial) / dias : 0
}

type Ponto = { data: string; valor: number }

/** Geometria de um gráfico de linha no tempo (peso, cotação, o que for).
 *  Eixo X proporcional ao tempo — as medições não acontecem em intervalos
 *  iguais, e espaçar por igual mentiria sobre o ritmo. */
export function tracarSerie(serie: Ponto[], larg: number, alt: number, m: number) {
  if (serie.length < 2) return null
  const t0 = Date.parse(serie[0].data)
  const span = Date.parse(serie[serie.length - 1].data) - t0 || 1
  const vs = serie.map((p) => p.valor)
  const folga = (Math.max(...vs) - Math.min(...vs)) * 0.2 || 10
  const min = Math.min(...vs) - folga
  const max = Math.max(...vs) + folga
  const emX = (d: string) => m + ((Date.parse(d) - t0) / span) * (larg - m * 2)
  const emY = (p: number) => m + (1 - (p - min) / (max - min)) * (alt - m * 2)
  return {
    min,
    max,
    emY,
    pontos: serie.map((p) => ({ ...p, x: emX(p.data), y: emY(p.valor) })),
  }
}

type Pesagem = { animal_id: string; data: string; peso: number }
type Cabeca = { id: string; peso_inicial: number | string | null }

/** Ganho médio diário do lote, período a período.
 *
 *  Cada marco é uma data de pesagem; o primeiro é a chegada, valendo o peso de
 *  entrada. Num período só entram os animais com peso conhecido nas DUAS pontas —
 *  senão um animal pesado só no fim entraria como se tivesse ganhado tudo sozinho. */
export function periodosDoLote(animais: Cabeca[], pesagens: Pesagem[], chegada: string) {
  const datas = [...new Set(pesagens.map((p) => p.data))].filter((d) => d > chegada).sort()
  if (!datas.length) return []

  const porAnimal = new Map<string, Pesagem[]>()
  for (const p of pesagens) porAnimal.set(p.animal_id, [...(porAnimal.get(p.animal_id) ?? []), p])
  for (const l of porAnimal.values()) l.sort((a, b) => (a.data < b.data ? -1 : 1))

  const pesoEm = (a: Cabeca, marco: string) => {
    let peso = Number(a.peso_inicial) || 0
    for (const p of porAnimal.get(a.id) ?? []) {
      if (p.data > marco) break
      peso = p.peso
    }
    return peso > 0 ? peso : null
  }

  const marcos = [chegada, ...datas]
  const periodos = []
  for (let i = 1; i < marcos.length; i++) {
    const de = marcos[i - 1]
    const ate = marcos[i]
    const dias = diasEntre(de, ate)
    if (dias <= 0) continue

    const ganhos: number[] = []
    const finais: number[] = []
    for (const a of animais) {
      const antes = pesoEm(a, de)
      const depois = pesoEm(a, ate)
      if (antes !== null && depois !== null) {
        ganhos.push(depois - antes)
        finais.push(depois)
      }
    }
    if (!ganhos.length) continue

    const ganho = ganhos.reduce((s, g) => s + g, 0) / ganhos.length
    periodos.push({
      de,
      ate,
      dias,
      cabecas: ganhos.length,
      pesoMedio: finais.reduce((s, p) => s + p, 0) / finais.length,
      ganho,
      gmd: ganho / dias,
    })
  }
  return periodos
}

/** Ganho por dia do lote no acumulado, da chegada até a última pesagem. */
export function gmdGeral(periodos: { dias: number; ganho: number }[]) {
  if (!periodos.length) return 0
  const dias = periodos.reduce((s, p) => s + p.dias, 0)
  const ganho = periodos.reduce((s, p) => s + p.ganho, 0)
  return dias > 0 ? ganho / dias : 0
}

// ---------- cabeças, ração e margem ----------

export const KG_POR_ARROBA = 15

/** Cabeças que ainda estão no lote. Morte e venda tiram do total. */
export const cabecasAtivas = (quantidade: number, saidas: { quantidade: number }[]) =>
  Math.max(0, quantidade - saidas.reduce((s, x) => s + Number(x.quantidade), 0))

/** Peso vivo em arrobas de carcaça. */
export const emArrobas = (pesoVivo: number, rendimento: number) =>
  (pesoVivo * (rendimento / 100)) / KG_POR_ARROBA

type Fornecimento = { formulacao_id: string; inicio: string; kg_dia: number | string }

/** kg/dia de cada formulação valendo numa data. Linha mais recente manda. */
export function fornecimentoVigente(fs: Fornecimento[], quando: string) {
  const vigente = new Map<string, number>()
  const escolhido = new Map<string, string>()
  for (const f of fs) {
    if (f.inicio > quando) continue
    const atual = escolhido.get(f.formulacao_id)
    if (!atual || f.inicio >= atual) {
      escolhido.set(f.formulacao_id, f.inicio)
      vigente.set(f.formulacao_id, Number(f.kg_dia))
    }
  }
  // quem foi zerado parou de ser fornecido
  for (const [id, kg] of vigente) if (!kg) vigente.delete(id)
  return vigente
}

/** kg consumidos por formulação entre duas datas, respeitando as trocas de quantidade. */
export function consumoNoPeriodo(fs: Fornecimento[], de: string, ate: string) {
  const total = new Map<string, number>()
  const porFormula = new Map<string, Fornecimento[]>()
  for (const f of fs) porFormula.set(f.formulacao_id, [...(porFormula.get(f.formulacao_id) ?? []), f])

  for (const [id, linhas] of porFormula) {
    const ordenadas = [...linhas].sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
    let kg = 0
    for (let i = 0; i < ordenadas.length; i++) {
      const vale = ordenadas[i]
      const fim = ordenadas[i + 1]?.inicio ?? ate
      const comeca = vale.inicio > de ? vale.inicio : de
      const termina = fim < ate ? fim : ate
      const dias = diasEntre(comeca, termina)
      if (dias > 0) kg += dias * Number(vale.kg_dia)
    }
    if (kg > 0) total.set(id, kg)
  }
  return total
}

/** Vale a pena segurar mais um dia? Ganho de valor menos o custo de manter. */
export function margemDiaria(p: {
  gmd: number
  rendimento: number
  precoArroba: number
  custoRacaoDia: number
  cabecas: number
}) {
  const arrobasDia = emArrobas(p.gmd, p.rendimento)
  const receitaDia = arrobasDia * p.precoArroba
  const custoDia = p.cabecas > 0 ? p.custoRacaoDia / p.cabecas : 0
  return { arrobasDia, receitaDia, custoDia, margem: receitaDia - custoDia }
}
