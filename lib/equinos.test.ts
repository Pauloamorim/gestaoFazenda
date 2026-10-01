import assert from 'node:assert/strict'
import test from 'node:test'
import { ratearValor } from './equinos.ts'

test('ratearValor preserva o total nos centavos', () => {
  const valores = ratearValor(100, 3)
  assert.deepEqual(valores, [33.34, 33.33, 33.33])
  assert.equal(Math.round(valores.reduce((s, valor) => s + valor, 0) * 100), 10_000)
})

test('ratearValor mantém custo individual sem alteração', () => {
  assert.deepEqual(ratearValor(79.9, 1), [79.9])
})

test('ratearValor exige ao menos um centavo por equino', () => {
  assert.throws(() => ratearValor(0.02, 3), /R\$ 0,01/)
})
