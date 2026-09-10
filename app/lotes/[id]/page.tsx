import Link from 'next/link'
import { notFound } from 'next/navigation'
import { carregarLote, historicoPraca, listarFormulacoes, pracasConhecidas } from '@/lib/dados'
import { brl, calcularMistura, dia, fornecimentoVigente, hoje, margemDiaria } from '@/lib/campos'
import { Brinco, Vazio } from '../../componentes'
import { GraficoGmd, GraficoSerie } from '../../grafico'
import { CATEGORIAS, cotacaoInicialDoCiclo, nomeCategoria, variacao } from '@/lib/cotacoes'
import { definirPraca, definirRendimento } from '../../actions'
import { excluir } from '../../actions'

export default async function Resumo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarLote(id)
  if (!dados) notFound()
  const { lote, custos, compras, eventos, investido, periodos, gmdLote, fornecimentos, cabecas } = dados

  // cotação da praça do lote: quanto a arroba andou desde que o gado chegou.
  // Lotes criados antes das outras categorias seguem em novilha.
  const categoria = lote.categoria ?? 'novilha_gorda'
  const historico = lote.praca ? await historicoPraca(categoria, lote.praca) : []
  const inicioCiclo = cotacaoInicialDoCiclo(historico, lote.data_chegada)
  const agora = historico[historico.length - 1]
  const desdeChegada =
    inicioCiclo && agora ? variacao(Number(inicioCiclo.vista), Number(agora.vista)) : null
  const noCiclo = inicioCiclo
    ? historico.filter((c: any) => c.data >= inicioCiclo.data)
    : []
  const pracas = lote.praca ? [] : await pracasConhecidas()

  // custo de ração por dia: kg/dia de cada mistura vigente × custo por kg dela
  const formulacoes = fornecimentos.length ? await listarFormulacoes() : []
  const custoKg = new Map<string, number>(
    formulacoes.map((f: any) => [f.id, calcularMistura(f.formulacao_itens).custoKg]),
  )
  const vigente = fornecimentoVigente(fornecimentos, hoje())
  const racaoDia = [...vigente].map(([id, kg]) => ({
    id,
    nome: fornecimentos.find((f: any) => f.formulacao_id === id)?.formulacoes?.nome ?? '—',
    kg,
    custo: kg * (custoKg.get(id) ?? 0),
  }))
  const custoRacaoDia = racaoDia.reduce((s, r) => s + r.custo, 0)
  const precoArroba = agora ? Number(agora.vista) : 0
  const m =
    gmdLote && precoArroba
      ? margemDiaria({
          gmd: gmdLote,
          rendimento: Number(lote.rendimento),
          precoArroba,
          custoRacaoDia,
          cabecas,
        })
      : null

  const porCategoria = new Map<string, number>()
  porCategoria.set('Aquisição', Number(lote.custo_aquisicao))
  if (Number(lote.frete)) porCategoria.set('Frete', Number(lote.frete))
  for (const c of custos) porCategoria.set(c.categoria, (porCategoria.get(c.categoria) ?? 0) + Number(c.valor))
  for (const c of compras)
    porCategoria.set(
      'Ração / ingredientes',
      (porCategoria.get('Ração / ingredientes') ?? 0) + Number(c.valor_total),
    )
  const linhas = [...porCategoria].sort((a, b) => b[1] - a[1])

  return (
    <>
      <div className="cartao">
        <div className="cabeca">
          <h2>Vale a pena segurar mais um dia?</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            O que cada cabeça ganha de valor por dia, menos o que ela come por dia.
          </p>
        </div>
        <div className="corpo">
          {!m ? (
            <p className="sub">
              Precisa de três coisas: pesagens para calcular o ganho diário, a praça de
              cotação escolhida abaixo e o fornecimento de ração lançado na aba Custos.
            </p>
          ) : (
            <>
              <div className="comparativo">
                <div>
                  <span className="rotulo">Ganho por dia</span>
                  <strong>{m.arrobasDia.toFixed(3).replace('.', ',')} @</strong>
                </div>
                <div>
                  <span className="rotulo">Valor gerado por dia</span>
                  <strong>{brl(m.receitaDia)}</strong>
                </div>
                <span className="seta">−</span>
                <div>
                  <span className="rotulo">Ração por dia</span>
                  <strong>{brl(m.custoDia)}</strong>
                </div>
                <span className="seta">=</span>
                <div className={m.margem >= 0 ? 'ganho' : 'perda'}>
                  <span className="rotulo">Margem por cabeça/dia</span>
                  <strong>
                    {m.margem > 0 ? '+' : ''}
                    {brl(m.margem)}
                  </strong>
                </div>
                <div className={m.margem >= 0 ? 'ganho' : 'perda'}>
                  <span className="rotulo">No lote todo ({cabecas} cab.)</span>
                  <strong>
                    {m.margem > 0 ? '+' : ''}
                    {brl(m.margem * cabecas)}
                  </strong>
                </div>
              </div>
              <p className="sub" style={{ marginTop: 14 }}>
                {m.margem >= 0
                  ? `Cada dia a mais rende ${brl(m.margem * cabecas)} no lote. Segurar ainda paga.`
                  : `Cada dia a mais custa ${brl(-m.margem * cabecas)} no lote. O gado está comendo mais do que engorda.`}{' '}
                Conta a {Number(lote.rendimento).toFixed(0).replace('.', ',')}% de rendimento de carcaça e{' '}
                {brl(precoArroba)} a arroba.
              </p>
              <form action={definirRendimento} className="linha" style={{ marginTop: 12 }}>
                <input type="hidden" name="lote_id" value={lote.id} />
                <label>
                  Rendimento de carcaça (%)
                  <input
                    name="rendimento"
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    defaultValue={Number(lote.rendimento)}
                  />
                </label>
                <button className="fantasma">Salvar</button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Preço da arroba no ciclo</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            {lote.praca
              ? `${nomeCategoria(categoria)} em ${lote.praca}, desde a chegada do lote.`
              : 'Escolha o que você vende e a praça da sua região para acompanhar o mercado deste lote.'}
          </p>
        </div>

        {!lote.praca ? (
          <div className="corpo">
            {!pracas.length ? (
              <p className="sub">
                Nenhuma cotação guardada ainda. Busque a primeira em{' '}
                <Link href="/cotacoes">Cotações</Link>.
              </p>
            ) : (
              <form action={definirPraca} className="linha">
                <input type="hidden" name="lote_id" value={lote.id} />
                <label>
                  Categoria
                  <select name="categoria" required defaultValue="boi_gordo">
                    {CATEGORIAS.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Praça de referência
                  <select name="praca" required defaultValue="">
                    <option value="" disabled>
                      Escolha…
                    </option>
                    {pracas.map((p: string) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <button>Acompanhar</button>
              </form>
            )}
          </div>
        ) : !inicioCiclo ? (
          <Vazio
            titulo={`Sem cotação de ${nomeCategoria(categoria)} em ${lote.praca}.`}
            dica="Confira se a categoria e a praça escolhidas existem na página de cotações."
          />
        ) : (
          <>
            <div className="corpo">
              <div className="comparativo">
                <div>
                  <span className="rotulo">
                    {inicioCiclo.data <= lote.data_chegada ? 'Na chegada' : 'Primeira coleta'} ·{' '}
                    {dia(inicioCiclo.data)}
                  </span>
                  <strong>{brl(Number(inicioCiclo.vista))}</strong>
                </div>
                <span className="seta">→</span>
                <div>
                  <span className="rotulo">Hoje · {dia(agora.data)}</span>
                  <strong>{brl(Number(agora.vista))}</strong>
                </div>
                <div className={desdeChegada! >= 0 ? 'ganho' : 'perda'}>
                  <span className="rotulo">Variação</span>
                  <strong>
                    {desdeChegada! > 0 ? '+' : ''}
                    {desdeChegada!.toFixed(1).replace('.', ',')}%
                  </strong>
                </div>
                <div>
                  <span className="rotulo">Por {agora.unidade}</span>
                  <strong>
                    {Number(agora.vista) - Number(inicioCiclo.vista) > 0 ? '+' : ''}
                    {brl(Number(agora.vista) - Number(inicioCiclo.vista))}
                  </strong>
                </div>
              </div>
            </div>
            {noCiclo.length >= 2 && (
              <GraficoSerie
                serie={noCiclo.map((c: any) => ({ data: c.data, valor: Number(c.vista) }))}
                sufixo={`/${agora.unidade}`}
              />
            )}
          </>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Ganho por dia do lote</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            Média de kg por cabeça por dia em cada intervalo entre pesagens. Só entram os animais
            pesados nas duas pontas do período.
          </p>
        </div>
        {!periodos.length ? (
          <Vazio
            titulo="Ainda não dá para calcular o ganho."
            dica="Registre o peso de entrada dos animais e pelo menos uma pesagem depois da chegada."
          />
        ) : (
          <>
            <GraficoGmd periodos={periodos} />
            <table>
              <thead>
                <tr>
                  <th>Período</th>
                  <th className="num">Dias</th>
                  <th className="num">Cabeças</th>
                  <th className="num">Peso médio</th>
                  <th className="num">Ganho no período</th>
                  <th className="num">Ganho por dia</th>
                </tr>
              </thead>
              <tbody>
                {periodos.map((p: any) => (
                  <tr key={p.ate}>
                    <td>
                      {dia(p.de)} → {dia(p.ate)}
                    </td>
                    <td className="num">{p.dias}</td>
                    <td className="num">{p.cabecas}</td>
                    <td className="num">{p.pesoMedio.toFixed(1)} kg</td>
                    <td className={`num ${p.ganho >= 0 ? 'ganho' : 'perda'}`}>
                      {p.ganho > 0 ? '+' : ''}
                      {p.ganho.toFixed(1)} kg
                    </td>
                    <td className={`num ${p.gmd >= 0 ? 'ganho' : 'perda'}`}>
                      {p.gmd.toFixed(3).replace('.', ',')} kg
                    </td>
                  </tr>
                ))}
                <tr className="total">
                  <td colSpan={5}>Média desde a chegada</td>
                  <td className="num">{gmdLote.toFixed(3).replace('.', ',')} kg</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Para onde foi o dinheiro</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th style={{ width: '40%' }}>Fatia</th>
              <th className="num">Valor</th>
              <th className="num">%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(([cat, valor]) => (
              <tr key={cat}>
                <td>{cat}</td>
                <td>
                  <span className="barra">
                    <i style={{ width: `${(valor / investido) * 100}%` }} />
                  </span>
                </td>
                <td className="num">{brl(valor)}</td>
                <td className="num">{((valor / investido) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="total">
              <td colSpan={2}>Total investido</td>
              <td className="num">{brl(investido)}</td>
              <td className="num">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Últimos registros</h2>
        </div>
        {!eventos.length ? (
          <Vazio titulo="Nada registrado ainda." dica="Vacinas, pesagens e ocorrências aparecem aqui." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Animal</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th className="num">Peso</th>
              </tr>
            </thead>
            <tbody>
              {eventos.slice(0, 8).map((e: any) => (
                <tr key={e.id}>
                  <td>{dia(e.data)}</td>
                  <td>
                    <Brinco id={e.animais?.identificacao} />
                  </td>
                  <td>
                    <span className="etiqueta">{e.tipo}</span>
                  </td>
                  <td>{e.descricao ?? '—'}</td>
                  <td className="num">{e.peso ? `${e.peso} kg` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="cartao">
        <div className="corpo" style={{ paddingTop: 16 }}>
          <details className="perigo-zona">
            <summary>Excluir este lote</summary>
            <p className="aviso">
              Apaga o lote, os animais, os custos e todo o histórico. Não tem como desfazer.
            </p>
            <form action={excluir} style={{ marginTop: 12 }}>
              <input type="hidden" name="tabela" value="lotes" />
              <input type="hidden" name="id" value={lote.id} />
              <input type="hidden" name="ir" value="/lotes" />
              <button className="perigo">Excluir {lote.nome}</button>
            </form>
          </details>
        </div>
      </div>
    </>
  )
}
