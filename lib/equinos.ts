export const CATEGORIAS_CUSTO_EQUINO = [
  'Alimentação / ração',
  'Veterinário',
  'Medicamento',
  'Vacina',
  'Exame',
  'Ferrageamento',
  'Sêmen / cobertura',
  'Coleta',
  'Inseminação',
  'Transferência de embrião',
  'Receptora',
  'Ultrassom / diagnóstico',
  'DNA / registro',
  'Transporte',
  'Treinamento',
  'Equipamento',
  'Outro',
] as const

export function ratearValor(valorTotal: number, quantidade: number) {
  const totalCentavos = Math.round(valorTotal * 100)
  if (!Number.isFinite(valorTotal) || valorTotal <= 0)
    throw new Error('O valor total deve ser maior que zero.')
  if (!Number.isInteger(quantidade) || quantidade < 1)
    throw new Error('Selecione pelo menos um equino.')
  if (totalCentavos < quantidade)
    throw new Error('O valor total deve permitir pelo menos R$ 0,01 para cada equino.')

  const valorBase = Math.floor(totalCentavos / quantidade)
  const sobra = totalCentavos % quantidade
  return Array.from(
    { length: quantidade },
    (_, indice) => (valorBase + (indice < sobra ? 1 : 0)) / 100,
  )
}
