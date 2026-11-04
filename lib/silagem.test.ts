import assert from 'node:assert/strict'
import test from 'node:test'
import { custoDoSaco, custoNoSaco, saldoPorDeposito } from './silagem.ts'

const mov = (tipo: string, sacos: number, deposito_id: string, area_id: string | null, data = '2026-11-01') => ({
  tipo,
  sacos,
  deposito_id,
  area_id,
  data,
})

test('saldoPorDeposito soma entradas e desconta uso por depósito', () => {
  const saldo = saldoPorDeposito([
    mov('producao', 115, 'q1', 'a1'),
    mov('saldo_inicial', 99, 'q2', null),
    mov('uso', 10, 'q1', null),
  ])
  assert.equal(saldo.get('q1'), 105)
  assert.equal(saldo.get('q2'), 99)
})

test('custoDoSaco soma o que cada insumo põe em um saco', () => {
  const milho = { qtd_comprada: 60, valor_pago: 90, qtd_por_saco: 2 } // R$ 1,50/kg × 2 kg
  const saco = { qtd_comprada: '100', valor_pago: '45', qtd_por_saco: '1' } // R$ 0,45 cada
  assert.equal(custoNoSaco(milho), 3)
  assert.equal(custoDoSaco([milho, saco]), 3.45)
  assert.equal(custoDoSaco([]), 0)
})
