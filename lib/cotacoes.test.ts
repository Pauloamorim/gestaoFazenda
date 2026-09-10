import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CATEGORIAS,
  cotacaoEm,
  cotacaoInicialDoCiclo,
  interpretarCotacoes,
  variacao,
} from './cotacoes.ts'

const ler = (nome: string) => readFileSync(new URL(`./fixtures/scot-${nome}.html`, import.meta.url), 'utf8')
const pagina = ler('novilha')

test('interpretarCotacoes lê a página real da Scot', () => {
  const { data, precos } = interpretarCotacoes(pagina)
  assert.equal(data, '2026-08-05')
  assert.ok(precos.length >= 8, `poucas praças: ${precos.length}`)

  const barretos = precos.find((p) => p.praca === 'SP Barretos')
  assert.deepEqual(barretos, { praca: 'SP Barretos', vista: 333, prazo30: 337, unidade: '@' })

  // a coluna de tendência é imagem: não pode virar preço
  const triangulo = precos.find((p) => p.praca === 'MG Triângulo')
  assert.deepEqual(triangulo, { praca: 'MG Triângulo', vista: 321, prazo30: 325, unidade: '@' })

  // RS é cotado por kg: tem que vir marcado, nunca misturado com arroba
  const rs = precos.find((p) => p.praca.startsWith('RS Oeste'))
  assert.equal(rs?.unidade, 'kg')
  assert.equal(rs?.vista, 12.1)
  assert.ok(precos.filter((p) => p.unidade === '@').every((p) => p.vista > 100))

  // nenhuma praça pode sair sem preço ou com preço absurdo
  for (const p of precos) {
    assert.ok(p.praca.length >= 2, `praça estranha: ${p.praca}`) // "SC" é praça válida
    const faixa = p.unidade === 'kg' ? [2, 60] : [100, 2000]
    assert.ok(
      p.vista > faixa[0] && p.vista < faixa[1],
      `${p.praca} com preço fora da realidade: ${p.vista} por ${p.unidade}`,
    )
    assert.ok(p.prazo30 >= p.vista, `${p.praca}: 30 dias deveria ser >= à vista`)
  }
})

test('lê as três categorias, não só novilha', () => {
  assert.deepEqual(
    CATEGORIAS.map((c) => c.slug),
    ['boi_gordo', 'novilha_gorda', 'vaca_gorda'],
  )

  for (const arquivo of ['boi-gordo', 'novilha', 'vaca-gorda']) {
    const { data, precos } = interpretarCotacoes(ler(arquivo))
    assert.equal(data, '2026-08-05', arquivo)
    assert.ok(precos.length >= 8, `${arquivo}: só ${precos.length} praças`)
    const barretos = precos.find((p) => p.praca === 'SP Barretos')
    assert.ok(barretos, `${arquivo}: sem SP Barretos`)
    assert.ok(barretos.vista > 100 && barretos.vista < 2000, `${arquivo}: ${barretos.vista}`)
  }
})

test('boi gordo: pega o Mercado Físico, não o Boi China que vem antes', () => {
  const { precos } = interpretarCotacoes(ler('boi-gordo'))
  const barretos = precos.find((p) => p.praca === 'SP Barretos')
  // Mercado Físico à vista = 345,50. O Boi China (352,00) é outro produto,
  // vem numa tabela antes e não pode vazar para cá.
  assert.equal(barretos?.vista, 345.5)
  assert.equal(barretos?.prazo30, 350)
  // a coluna "# base" vale 0,00 e não pode ser confundida com preço
  const porArroba = precos.filter((p) => p.unidade === '@')
  assert.ok(porArroba.every((p) => p.vista > 100), 'alguma praça pegou a coluna base (0,00)')
  // "São Paulo" e "Minas Gerais" são praças do Boi China, não do Mercado Físico
  assert.ok(!precos.some((p) => p.praca === 'São Paulo'), 'vazou praça da tabela do Boi China')
})

test('boi gordo e vaca gorda têm preços diferentes entre si', () => {
  const boi = interpretarCotacoes(ler('boi-gordo')).precos.find((p) => p.praca === 'SP Barretos')!
  const vaca = interpretarCotacoes(ler('vaca-gorda')).precos.find((p) => p.praca === 'SP Barretos')!
  const novilha = interpretarCotacoes(pagina).precos.find((p) => p.praca === 'SP Barretos')!
  assert.equal(vaca.vista, 318)
  assert.equal(novilha.vista, 333)
  assert.ok(boi.vista > novilha.vista && novilha.vista > vaca.vista, 'ordem de preço inesperada')
})

test('interpretarCotacoes reclama quando o site muda', () => {
  assert.throws(() => interpretarCotacoes('<html><body>nada aqui</body></html>'), /Mercado Físico/)
  assert.throws(
    () => interpretarCotacoes('<table>Mercado Físico<tr><td>sem data</td></tr></table>'),
    /data da cotação/,
  )
  assert.throws(
    () =>
      interpretarCotacoes(
        "<table>Mercado Físico 01/01/2026<tr class='conteudo'><td>SP</td></tr></table>",
      ),
    /nenhuma praça legível/,
  )
})

test('cotacaoEm pega a vigente, não a futura', () => {
  const h = [
    { data: '2026-03-01', vista: 300 },
    { data: '2026-05-01', vista: 320 },
    { data: '2026-08-01', vista: 333 },
  ]
  assert.equal(cotacaoEm(h, '2026-06-15')?.vista, 320) // a de maio ainda vale
  assert.equal(cotacaoEm(h, '2026-05-01')?.vista, 320) // no dia exato, vale a do dia
  assert.equal(cotacaoEm(h, '2026-02-01'), null) // antes de tudo, não há
})

test('cotacaoInicialDoCiclo usa a primeira coleta quando não há preço na chegada', () => {
  const h = [
    { data: '2026-05-03', vista: 310, unidade: '@' },
    { data: '2026-05-10', vista: 320, unidade: '@' },
  ]

  // O lote chegou antes de começarmos a coletar. Ainda assim o ciclo deve aparecer.
  assert.equal(cotacaoInicialDoCiclo(h, '2026-05-01')?.vista, 310)
  // Havendo preço anterior, continua valendo o preço vigente na chegada.
  assert.equal(cotacaoInicialDoCiclo(h, '2026-05-06')?.vista, 310)
  assert.equal(cotacaoInicialDoCiclo([], '2026-05-01'), null)
})

test('variacao', () => {
  assert.equal(variacao(300, 333), 11)
  assert.equal(variacao(300, 270), -10)
  assert.equal(variacao(0, 333), 0)
})
