export const CULTURAS_SILAGEM = ['Capiaçu', 'Milho', 'Sorgo', 'Cana', 'Capim-elefante']

type Movimento = { tipo: string; sacos: number; deposito_id: string; area_id: string | null; data: string }

/** Uso tira do depósito; produção e saldo inicial colocam. */
export function saldoPorDeposito(movimentos: Movimento[]) {
  const saldo = new Map<string, number>()
  for (const m of movimentos)
    saldo.set(m.deposito_id, (saldo.get(m.deposito_id) ?? 0) + (m.tipo === 'uso' ? -m.sacos : m.sacos))
  return saldo
}

type Insumo = { preco_unitario: number | string; qtd_por_saco: number | string }

/** Quanto deste insumo vai em um saco, em reais: preço da unidade × quantidade por saco. */
export const custoNoSaco = (i: Insumo) => Number(i.preco_unitario) * Number(i.qtd_por_saco)

export const custoDoSaco = (insumos: Insumo[]) => insumos.reduce((s, i) => s + custoNoSaco(i), 0)
