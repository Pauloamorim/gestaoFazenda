export const FONTE = 'Scot Consultoria'

/** As três categorias que interessam para engorda. Cada uma tem sua página. */
export const CATEGORIAS = [
  { slug: 'boi_gordo', nome: 'Boi gordo', url: 'https://www.scotconsultoria.com.br/cotacoes/boi-gordo/?ref=smn' },
  { slug: 'novilha_gorda', nome: 'Novilha gorda', url: 'https://www.scotconsultoria.com.br/cotacoes/novilha/?ref=smn' },
  { slug: 'vaca_gorda', nome: 'Vaca gorda', url: 'https://www.scotconsultoria.com.br/cotacoes/vaca-gorda/?ref=smn' },
] as const

export type Slug = (typeof CATEGORIAS)[number]['slug']

export const nomeCategoria = (slug: string) =>
  CATEGORIAS.find((c) => c.slug === slug)?.nome ?? slug

const ENTIDADES: Record<string, string> = {
  agrave: 'à',
  aacute: 'á',
  atilde: 'ã',
  acirc: 'â',
  ccedil: 'ç',
  eacute: 'é',
  ecirc: 'ê',
  iacute: 'í',
  oacute: 'ó',
  otilde: 'õ',
  ocirc: 'ô',
  uacute: 'ú',
  amp: '&',
  nbsp: ' ',
}

const limpar = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&([a-zA-Z]+);/g, (t, n) => ENTIDADES[n] ?? t)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()

/** A Scot cota quase tudo por arroba, mas RS vem por kg. Misturar as duas
 *  escalas corromperia qualquer comparação, e converter também: kg é peso vivo,
 *  arroba é carcaça. Então a unidade viaja junto com o preço. */
export type Cotacao = { praca: string; vista: number; prazo30: number; unidade: '@' | 'kg' }

/** Lê a tabela de cotações da Scot. Estoura com mensagem clara se o site mudar —
 *  scraper que falha em silêncio é pior que scraper que não existe. */
export function interpretarCotacoes(html: string): { data: string; precos: Cotacao[] } {
  // A página do boi gordo traz "Boi China a Prazo" antes da tabela que interessa.
  // Escolher pela posição pegaria o produto errado — então escolhe pelo título.
  const tabelas = html.match(/<table[\s\S]*?<\/table>/gi) ?? []
  const tabela = tabelas.find((t) => /Mercado\s+F(í|&iacute;|i)sico/i.test(t))
  if (!tabela)
    throw new Error('Não achei a tabela "Mercado Físico" na página da Scot. O site deve ter mudado.')

  const d = tabela.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!d) throw new Error('Não achei a data da cotação na página da Scot. O site deve ter mudado.')
  const data = `${d[3]}-${d[2]}-${d[1]}`

  const precos: Cotacao[] = []
  for (const tr of tabela.match(/<tr[^>]*class=['"]conteudo['"][\s\S]*?<\/tr>/gi) ?? []) {
    const celulas = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => limpar(m[1]))
    const praca = celulas[0]
    // as colunas de tendência trazem imagem, não número; ficam de fora
    const numeros = celulas.slice(1).filter((v) => /^\d{1,4},\d{2}$/.test(v))
    if (!praca || numeros.length < 2) continue
    precos.push({
      praca,
      vista: Number(numeros[0].replace(',', '.')),
      prazo30: Number(numeros[1].replace(',', '.')),
      unidade: /\(kg\)/i.test(praca) ? 'kg' : '@',
    })
  }

  if (!precos.length)
    throw new Error('A tabela da Scot veio sem nenhuma praça legível. O site deve ter mudado.')
  return { data, precos }
}

/** Cotação vigente numa data: a mais recente em ou antes dela. */
export function cotacaoEm(historico: { data: string; vista: number }[], quando: string) {
  let achada: { data: string; vista: number } | null = null
  for (const c of historico) if (c.data <= quando && (!achada || c.data > achada.data)) achada = c
  return achada
}

/** Preço inicial para acompanhar um lote.
 *
 * Usa a cotação vigente na chegada. Se a coleta começou depois, usa a primeira
 * disponível em vez de esconder todo o histórico do ciclo. */
export function cotacaoInicialDoCiclo<T extends { data: string; vista: number }>(
  historico: T[],
  chegada: string,
): T | null {
  const vigente = cotacaoEm(historico, chegada)
  if (vigente) return historico.find((c) => c.data === vigente.data) ?? null

  let primeira: T | null = null
  for (const c of historico)
    if (c.data > chegada && (!primeira || c.data < primeira.data)) primeira = c
  return primeira
}

/** Variação percentual entre dois preços. */
export const variacao = (de: number, para: number) => (de > 0 ? ((para - de) / de) * 100 : 0)
