import Link from 'next/link'
import { cotacoesRecentes, historicoPraca } from '@/lib/dados'
import { brl, dia, hoje } from '@/lib/campos'
import { CATEGORIAS, FONTE, nomeCategoria, variacao } from '@/lib/cotacoes'
import { atualizarCotacoes } from '../actions'
import { Vazio } from '../componentes'
import { GraficoSerie } from '../grafico'

const PADRAO = 'boi_gordo'

export default async function Cotacoes({
  searchParams,
}: {
  searchParams: Promise<{ praca?: string; categoria?: string }>
}) {
  const busca = await searchParams
  const categoria = CATEGORIAS.find((c) => c.slug === busca.categoria)?.slug ?? PADRAO
  const linhas = await cotacoesRecentes(categoria)

  const ultimaData = linhas[0]?.data
  const doDia = linhas.filter((c: any) => c.data === ultimaData)
  const escolhida = busca.praca ?? doDia[0]?.praca
  const historico = escolhida ? await historicoPraca(categoria, escolhida) : []
  const unidade = historico[0]?.unidade ?? '@'

  const serie = historico.map((c: any) => ({ data: c.data, valor: Number(c.vista) }))
  const primeiro = serie[0]
  const ultimo = serie[serie.length - 1]
  const varia = primeiro && ultimo ? variacao(primeiro.valor, ultimo.valor) : 0

  const comPraca = (p?: string) =>
    `/cotacoes?categoria=${categoria}${p ? `&praca=${encodeURIComponent(p)}` : ''}`

  return (
    <>
      <div className="topo">
        <div>
          <h1>Cotações</h1>
          <p className="sub">
            Preços brutos por praça, direto da{' '}
            <a href={CATEGORIAS.find((c) => c.slug === categoria)!.url} target="_blank" rel="noopener noreferrer">
              {FONTE}
            </a>
            .
          </p>
        </div>
        <div className="acao-topo">
          <form action={atualizarCotacoes}>
            <button>Atualizar as {CATEGORIAS.length} categorias</button>
          </form>
          <span className="rotulo">
            {!ultimaData
              ? 'Nada coletado ainda'
              : ultimaData === hoje()
                ? `Atualizado hoje, ${dia(ultimaData)}`
                : `Última coleta: ${dia(ultimaData)}`}
          </span>
        </div>
      </div>

      <div className="abas" style={{ marginTop: 16 }}>
        {CATEGORIAS.map((c) => (
          <Link
            key={c.slug}
            href={`/cotacoes?categoria=${c.slug}`}
            className={c.slug === categoria ? 'aba ativa' : 'aba'}
          >
            {c.nome}
          </Link>
        ))}
      </div>

      {!linhas.length ? (
        <div className="cartao">
          <Vazio
            titulo={`Nenhuma cotação de ${nomeCategoria(categoria).toLowerCase()} guardada.`}
            dica="Use o botão lá em cima: ele traz boi gordo, novilha e vaca gorda de uma vez."
          />
        </div>
      ) : (
        <>
          <div className="readout">
            <div>
              <span className="n">{brl(Number(ultimo?.valor ?? 0))}</span>
              <span className="rotulo">
                {escolhida} · por {unidade}
              </span>
            </div>
            <div>
              <span className="n">{dia(ultimaData)}</span>
              <span className="rotulo">Última cotação</span>
            </div>
            <div className="destaque">
              <span className="n">
                {varia > 0 ? '+' : ''}
                {varia.toFixed(1).replace('.', ',')}%
              </span>
              <span className="rotulo">Desde {primeiro ? dia(primeiro.data) : '—'}</span>
            </div>
            <div>
              <span className="n">{serie.length}</span>
              <span className="rotulo">Dias registrados</span>
            </div>
          </div>

          <div className="cartao" style={{ marginTop: 22 }}>
            <div className="cabeca">
              <h2>
                {nomeCategoria(categoria)} · {escolhida}
              </h2>
              <p className="sub" style={{ marginTop: -6 }}>
                {serie.length < 2
                  ? 'Um dia só por enquanto — o gráfico aparece a partir da segunda coleta.'
                  : `Preço à vista por ${unidade}, de ${dia(primeiro.data)} a ${dia(ultimo.data)}.`}
              </p>
            </div>
            {serie.length >= 2 && <GraficoSerie serie={serie} sufixo={`/${unidade}`} />}
          </div>

          <div className="cartao">
            <div className="cabeca">
              <h2>
                Praças em {dia(ultimaData)}{' '}
                {ultimaData !== hoje() && <span className="etiqueta alerta">não é de hoje</span>}
              </h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Praça</th>
                  <th className="num">À vista</th>
                  <th className="num">30 dias</th>
                  <th className="num">Unidade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {doDia.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: c.praca === escolhida ? 600 : 400 }}>{c.praca}</td>
                    <td className="num">{brl(Number(c.vista))}</td>
                    <td className="num">{brl(Number(c.prazo30))}</td>
                    <td className="num">{c.unidade}</td>
                    <td className="acao">
                      {c.praca !== escolhida && <Link href={comPraca(c.praca)}>ver</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
