export const CULTURAS_SILAGEM = ['Capiaçu', 'Milho', 'Sorgo', 'Cana', 'Capim-elefante']

export const CATEGORIAS_CUSTO_SILAGEM = [
  'Sacos',
  'Combustível',
  'Mão de obra',
  'Adubo',
  'Manutenção da máquina',
  'Inoculante',
  'Outros',
]

type Movimento = { tipo: string; sacos: number; deposito_id: string; area_id: string | null; data: string }
type Custo = { valor: number | string; area_id: string | null; data: string }

/** Uso tira do depósito; produção e saldo inicial colocam. */
export function saldoPorDeposito(movimentos: Movimento[]) {
  const saldo = new Map<string, number>()
  for (const m of movimentos)
    saldo.set(m.deposito_id, (saldo.get(m.deposito_id) ?? 0) + (m.tipo === 'uso' ? -m.sacos : m.sacos))
  return saldo
}

/** Custo por saco produzido, contado a partir do primeiro custo lançado:
 *  sacos feitos antes disso não têm custo registrado e só diluiriam a conta.
 *  Custo sem área é rateado entre as áreas pela produção de cada uma. */
export function custoPorSaco(custos: Custo[], movimentos: Movimento[]) {
  const porArea = new Map<string, number>()
  if (!custos.length) return { desde: null, total: 0, sacos: 0, geral: 0, porArea }

  const desde = custos.reduce((d, c) => (c.data < d ? c.data : d), custos[0].data)
  const sacosArea = new Map<string, number>()
  for (const m of movimentos)
    if (m.tipo === 'producao' && m.area_id && m.data >= desde)
      sacosArea.set(m.area_id, (sacosArea.get(m.area_id) ?? 0) + m.sacos)

  const sacos = [...sacosArea.values()].reduce((s, n) => s + n, 0)
  const total = custos.reduce((s, c) => s + Number(c.valor), 0)
  const semArea = custos.filter((c) => !c.area_id).reduce((s, c) => s + Number(c.valor), 0)

  for (const [area, n] of sacosArea) {
    const proprio = custos.filter((c) => c.area_id === area).reduce((s, c) => s + Number(c.valor), 0)
    porArea.set(area, (proprio + (semArea * n) / sacos) / n)
  }
  return { desde, total, sacos, geral: sacos ? total / sacos : 0, porArea }
}
