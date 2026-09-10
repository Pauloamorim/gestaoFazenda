import { test } from 'node:test'
import assert from 'node:assert/strict'
import { numero, numeroObrigatorio, obrigatorio, texto, dia, tamanho, calcularMistura, custoMedio, ultimoPreco, diasEntre, ganhoDiario, tracarSerie, periodosDoLote, gmdGeral, cabecasAtivas, emArrobas, fornecimentoVigente, consumoNoPeriodo, margemDiaria } from './campos.ts'

test('numero', () => {
  assert.equal(numero('1234,50', 'x'), 1234.5)
  assert.equal(numero('1234.50', 'x'), 1234.5)
  assert.equal(numero('0', 'x'), 0)
  assert.equal(numero('', 'x'), null)
  assert.equal(numero('  ', 'x'), null)
  assert.equal(numero(null, 'x'), null)
  assert.throws(() => numero('abc', 'Peso'), /Peso/)
})

test('obrigatorios', () => {
  assert.equal(obrigatorio(' 12 ', 'x'), '12')
  assert.throws(() => obrigatorio('  ', 'Nome'), /Nome/)
  assert.throws(() => numeroObrigatorio('', 'Valor'), /Valor/)
  assert.equal(numeroObrigatorio('0', 'x'), 0)
  assert.equal(texto(''), null)
})

test('dia', () => assert.equal(dia('2026-08-03'), '03/08/2026'))

test('tamanho', () => {
  assert.equal(tamanho(500), '1 KB')
  assert.equal(tamanho(204800), '200 KB')
  assert.equal(tamanho(1572864), '1,5 MB')
  assert.equal(tamanho(10485760), '10,0 MB')
})

test('calcularMistura', () => {
  const itens = [
    { quantidade: 700, ingredientes: { custo_kg: 1.2 } }, // milho
    { quantidade: 250, ingredientes: { custo_kg: 2.5 } }, // farelo de soja
    { quantidade: 50, ingredientes: { custo_kg: 4 } }, // núcleo mineral
  ]
  const m = calcularMistura(itens)
  assert.equal(m.kg, 1000)
  assert.equal(m.custo, 840 + 625 + 200)
  assert.equal(m.custoKg, 1.665)
  assert.equal(m.custoTon, 1665)
  const vazia = calcularMistura([])
  assert.equal(vazia.custoKg, 0)
  assert.equal(vazia.custoTon, 0)
})

test('custoMedio e ultimoPreco', () => {
  const compras = [
    { data: '2026-03-01', quantidade: 1000, valor_total: 1200 }, // R$ 1,20/kg
    { data: '2026-05-10', quantidade: 500, valor_total: 750 }, //  R$ 1,50/kg
  ]
  const m = custoMedio(compras)
  assert.equal(m.kg, 1500)
  assert.equal(m.total, 1950)
  assert.equal(m.medio, 1.3) // ponderado, não a média simples de 1,35
  assert.equal(ultimoPreco(compras), 1.5)

  assert.equal(custoMedio([]).medio, 0)
  assert.equal(ultimoPreco([]), 0)
})

test('diasEntre e ganhoDiario', () => {
  assert.equal(diasEntre('2026-03-01', '2026-03-31'), 30)
  assert.equal(diasEntre('2026-03-01', '2026-03-01'), 0)
  // 280 kg -> 340 kg em 100 dias = 0,6 kg/dia
  assert.equal(ganhoDiario(280, 340, '2026-01-01', '2026-04-11'), 0.6)
  // sem intervalo não dá para dividir: devolve 0 em vez de Infinity
  assert.equal(ganhoDiario(280, 340, '2026-01-01', '2026-01-01'), 0)
  // horário de verão no meio do intervalo não pode virar 29,96 dias
  assert.equal(diasEntre('2026-10-01', '2026-11-01'), 31)
})

test('tracarSerie', () => {
  const g = tracarSerie(
    [
      { data: '2026-01-01', valor: 280 },
      { data: '2026-02-01', valor: 300 },
      { data: '2026-04-01', valor: 340 },
    ],
    400,
    200,
    20,
  )
  assert.ok(g)
  const [a, b, c] = g.pontos
  assert.equal(a.x, 20) // primeiro encostado na margem
  assert.equal(c.x, 380) // último na margem oposta
  // 1o fev está a 31/90 do intervalo: proporcional ao tempo, não a 1/2
  assert.ok(Math.abs(b.x - (20 + (31 / 90) * 360)) < 0.5)
  assert.ok(a.y > c.y) // mais pesado = mais alto na tela
  for (const p of g.pontos) assert.ok(p.y >= 20 && p.y <= 180, `y fora da area: ${p.y}`)

  // menos de duas pesagens não vira gráfico
  assert.equal(tracarSerie([{ data: '2026-01-01', valor: 280 }], 400, 200, 20), null)

  // peso constante não pode dividir por zero
  const reto = tracarSerie(
    [
      { data: '2026-01-01', valor: 300 },
      { data: '2026-02-01', valor: 300 },
    ],
    400,
    200,
    20,
  )
  assert.ok(reto && reto.pontos.every((p) => Number.isFinite(p.y)))

  // duas pesagens no mesmo dia não podem gerar x = NaN
  const mesmoDia = tracarSerie(
    [
      { data: '2026-01-01', valor: 300 },
      { data: '2026-01-01', valor: 305 },
    ],
    400,
    200,
    20,
  )
  assert.ok(mesmoDia && mesmoDia.pontos.every((p) => Number.isFinite(p.x)))
})

test('periodosDoLote', () => {
  const animais = [
    { id: 'a', peso_inicial: 280 },
    { id: 'b', peso_inicial: 300 },
  ]
  const pesagens = [
    { animal_id: 'a', data: '2026-02-01', peso: 310 },
    { animal_id: 'b', data: '2026-02-01', peso: 330 },
    { animal_id: 'a', data: '2026-04-01', peso: 350 },
    { animal_id: 'b', data: '2026-04-01', peso: 370 },
  ]
  const p = periodosDoLote(animais, pesagens, '2026-01-01')
  assert.equal(p.length, 2)
  assert.equal(p[0].dias, 31)
  assert.equal(p[0].ganho, 30) // os dois ganharam 30
  assert.equal(p[0].cabecas, 2)
  assert.equal(p[0].pesoMedio, 320)
  assert.ok(Math.abs(p[0].gmd - 30 / 31) < 1e-9)
  assert.equal(p[1].dias, 59)
  assert.equal(p[1].ganho, 40)

  // animal sem peso de entrada só conta a partir da 1a pesagem dele
  const comNovato = periodosDoLote(
    [...animais, { id: 'c', peso_inicial: null }],
    [...pesagens, { animal_id: 'c', data: '2026-02-01', peso: 200 }],
    '2026-01-01',
  )
  assert.equal(comNovato[0].cabecas, 2) // 'c' fora: não tinha peso na chegada
  assert.equal(comNovato[0].ganho, 30) // e não puxa a média para baixo
  assert.equal(comNovato[1].cabecas, 3) // no 2o período já tem as duas pontas

  // sem pesagem nenhuma não há período
  assert.deepEqual(periodosDoLote(animais, [], '2026-01-01'), [])
  // pesagem no dia da chegada não vira período de zero dia
  assert.deepEqual(
    periodosDoLote(animais, [{ animal_id: 'a', data: '2026-01-01', peso: 280 }], '2026-01-01'),
    [],
  )
  // perda de peso resulta em gmd negativo
  const magro = periodosDoLote(
    [{ id: 'a', peso_inicial: 300 }],
    [{ animal_id: 'a', data: '2026-01-11', peso: 290 }],
    '2026-01-01',
  )
  assert.equal(magro[0].gmd, -1)
})

test('gmdGeral', () => {
  assert.equal(gmdGeral([{ dias: 31, ganho: 30 }, { dias: 59, ganho: 40 }]), 70 / 90)
  assert.equal(gmdGeral([]), 0)
})

test('cabecasAtivas', () => {
  assert.equal(cabecasAtivas(47, []), 47)
  assert.equal(cabecasAtivas(47, [{ quantidade: 2 }, { quantidade: 5 }]), 40)
  // não pode ficar negativo nem por engano de lançamento
  assert.equal(cabecasAtivas(3, [{ quantidade: 10 }]), 0)
})

test('emArrobas', () => {
  assert.equal(emArrobas(450, 50), 15) // 450 kg vivos, 50% = 225 kg carcaça = 15 @
  assert.equal(emArrobas(0.6, 50), 0.02) // ganho diário vira arroba por dia
})

test('fornecimentoVigente', () => {
  const fs = [
    { formulacao_id: 'mix', inicio: '2026-03-01', kg_dia: 200 },
    { formulacao_id: 'mix', inicio: '2026-05-01', kg_dia: 260 },
    { formulacao_id: 'sal', inicio: '2026-03-01', kg_dia: 12 },
  ]
  assert.equal(fornecimentoVigente(fs, '2026-04-01').get('mix'), 200)
  assert.equal(fornecimentoVigente(fs, '2026-06-01').get('mix'), 260) // trocou
  assert.equal(fornecimentoVigente(fs, '2026-02-01').size, 0) // antes de tudo
  assert.equal(fornecimentoVigente(fs, '2026-06-01').get('sal'), 12)

  // kg_dia 0 encerra o fornecimento
  const parou = [...fs, { formulacao_id: 'sal', inicio: '2026-06-01', kg_dia: 0 }]
  assert.equal(fornecimentoVigente(parou, '2026-07-01').has('sal'), false)
  assert.equal(fornecimentoVigente(parou, '2026-05-15').get('sal'), 12) // antes ainda valia
})

test('consumoNoPeriodo soma cada faixa com a quantidade da época', () => {
  const fs = [
    { formulacao_id: 'mix', inicio: '2026-03-01', kg_dia: 200 },
    { formulacao_id: 'mix', inicio: '2026-05-01', kg_dia: 260 },
  ]
  // 61 dias a 200 kg + 31 dias a 260 kg
  const c = consumoNoPeriodo(fs, '2026-03-01', '2026-06-01')
  assert.equal(c.get('mix'), 61 * 200 + 31 * 260)

  // recorte que começa depois da troca só conta a quantidade nova
  assert.equal(consumoNoPeriodo(fs, '2026-05-01', '2026-06-01').get('mix'), 31 * 260)
  // recorte antes do início não consome nada
  assert.equal(consumoNoPeriodo(fs, '2026-01-01', '2026-02-01').size, 0)
})

test('margemDiaria', () => {
  // 0,6 kg/dia a 50% = 0,02 @/dia; a R$ 345 = R$ 6,90/dia por cabeça
  const m = margemDiaria({ gmd: 0.6, rendimento: 50, precoArroba: 345, custoRacaoDia: 208, cabecas: 40 })
  assert.equal(m.arrobasDia, 0.02)
  assert.ok(Math.abs(m.receitaDia - 6.9) < 1e-9)
  assert.equal(m.custoDia, 5.2) // 208 kg-reais/dia dividido por 40 cabeças
  assert.ok(Math.abs(m.margem - 1.7) < 1e-9)

  // ração cara demais para o ganho: margem negativa, hora de vender
  const ruim = margemDiaria({ gmd: 0.2, rendimento: 50, precoArroba: 345, custoRacaoDia: 400, cabecas: 40 })
  assert.ok(ruim.margem < 0)

  // lote sem cabeça não divide por zero
  assert.equal(margemDiaria({ gmd: 0.6, rendimento: 50, precoArroba: 345, custoRacaoDia: 100, cabecas: 0 }).custoDia, 0)
})
