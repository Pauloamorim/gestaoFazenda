import assert from 'node:assert/strict'
import test from 'node:test'
import { distribuirCustoEquino, ratearValor } from './equinos.ts'

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

test('distribuirCustoEquino mantém gasto geral sem vínculo com animal', () => {
  assert.deepEqual(distribuirCustoEquino(150.75, []), [
    { equino_id: null, valor: 150.75 },
  ])
})

test('distribuirCustoEquino rateia somente entre os animais selecionados', () => {
  assert.deepEqual(distribuirCustoEquino(100, ['a', 'b', 'c']), [
    { equino_id: 'a', valor: 33.34 },
    { equino_id: 'b', valor: 33.33 },
    { equino_id: 'c', valor: 33.33 },
  ])
})
