import assert from 'node:assert/strict'
import test from 'node:test'
import { custoPorSaco, saldoPorDeposito } from './silagem.ts'

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

test('custoPorSaco ignora produção anterior ao primeiro custo e rateia custo geral', () => {
  const r = custoPorSaco(
    [
      { valor: 100, area_id: 'a1', data: '2026-11-01' },
      { valor: '60', area_id: null, data: '2026-11-02' },
    ],
    [
      mov('producao', 500, 'q1', 'a1', '2026-10-01'), // antes do primeiro custo
      mov('producao', 20, 'q1', 'a1'),
      mov('producao', 10, 'q1', 'a2'),
      mov('saldo_inicial', 99, 'q2', null),
    ],
  )
  assert.equal(r.desde, '2026-11-01')
  assert.equal(r.sacos, 30)
  assert.equal(r.geral, 160 / 30)
  assert.equal(r.porArea.get('a1'), (100 + 40) / 20)
  assert.equal(r.porArea.get('a2'), 20 / 10)
})

test('custoPorSaco sem custos não divide por zero', () => {
  assert.equal(custoPorSaco([], [mov('producao', 10, 'q1', 'a1')]).geral, 0)
})
