import Link from 'next/link'
import { notFound } from 'next/navigation'
import { carregarFormulacao, listarIngredientes } from '@/lib/dados'
import { brl, calcularMistura } from '@/lib/campos'
import { adicionarItem, excluir } from '../../actions'
import { Excluir, Vazio } from '../../componentes'

export default async function Formulacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [formulacao, ingredientes] = await Promise.all([carregarFormulacao(id), listarIngredientes()])
  if (!formulacao) notFound()

  const itens = [...formulacao.formulacao_itens].sort(
    (a: any, b: any) => Number(b.quantidade) - Number(a.quantidade),
  )
  const m = calcularMistura(itens)
  const usados = new Set(itens.map((i: any) => i.ingredientes.id))
  const disponiveis = ingredientes.filter((i: any) => !usados.has(i.id))
  const semPreco = itens.filter((i: any) => !i.ingredientes.kg_comprado)

  return (
    <>
      <h1>{formulacao.nome}</h1>
      <p className="sub">{formulacao.observacoes ?? 'Mistura reaproveitável em qualquer lote.'}</p>

      {semPreco.length > 0 && (
        <p className="aviso" style={{ marginTop: 14 }}>
          Sem compra registrada para {semPreco.map((i: any) => i.ingredientes.nome).join(', ')} — esses
          entram valendo zero e o custo abaixo está menor do que o real.
        </p>
      )}

      <div className="readout">
        <div>
          <span className="n">{m.kg ? m.kg.toFixed(0) : '—'}</span>
          <span className="rotulo">Batida (kg)</span>
        </div>
        <div>
          <span className="n">{brl(m.custo)}</span>
          <span className="rotulo">Custo da batida</span>
        </div>
        <div className="destaque">
          <span className="n">{brl(m.custoKg)}</span>
          <span className="rotulo">Custo médio por kg</span>
        </div>
        <div>
          <span className="n">{brl(m.custoTon)}</span>
          <span className="rotulo">Custo por tonelada</span>
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca">
          <h2>Adicionar ingrediente</h2>
        </div>
        <div className="corpo">
          {!ingredientes.length ? (
            <p className="sub">
              Você ainda não tem ingredientes. <Link href="/racao/ingredientes">Cadastre um primeiro</Link>.
            </p>
          ) : !disponiveis.length ? (
            <p className="sub">Todos os seus ingredientes já estão nesta mistura.</p>
          ) : (
            <form action={adicionarItem} className="linha">
              <input type="hidden" name="formulacao_id" value={id} />
              <label className="larga">
                Ingrediente
                <select name="ingrediente_id" required defaultValue="">
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {disponiveis.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.nome}
                      {i.kg_comprado ? ` — ${brl(i.custo_kg)}/kg` : ' — sem compra'}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantidade (kg)
                <input name="quantidade" type="number" min="0.001" step="any" required />
              </label>
              <button>Adicionar</button>
            </form>
          )}
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Composição</h2>
        </div>
        {!itens.length ? (
          <Vazio titulo="Mistura vazia." dica="Adicione os ingredientes e as quantidades da sua batida." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th style={{ width: '26%' }}>Participação</th>
                <th className="num">Quantidade</th>
                <th className="num">%</th>
                <th className="num">Custo médio/kg</th>
                <th className="num">Custo no total</th>
                <th className="acao"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i: any) => {
                const parte = Number(i.quantidade) / m.kg
                return (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 500 }}>{i.ingredientes.nome}</td>
                    <td>
                      <span className="barra">
                        <i style={{ width: `${parte * 100}%` }} />
                      </span>
                    </td>
                    <td className="num">{Number(i.quantidade).toFixed(1)} kg</td>
                    <td className="num">{(parte * 100).toFixed(1)}%</td>
                    <td className="num">
                      {i.ingredientes.kg_comprado ? (
                        brl(Number(i.ingredientes.custo_kg))
                      ) : (
                        <span className="etiqueta alerta">sem compra</span>
                      )}
                    </td>
                    <td className="num">{brl(Number(i.quantidade) * Number(i.ingredientes.custo_kg))}</td>
                    <td className="acao">
                      <Excluir id={i.id} tabela="formulacao_itens" revalidar={`/racao/${id}`} />
                    </td>
                  </tr>
                )
              })}
              <tr className="total">
                <td colSpan={2}>Batida completa</td>
                <td className="num">{m.kg.toFixed(1)} kg</td>
                <td className="num">100%</td>
                <td className="num">{brl(m.custoKg)}</td>
                <td className="num">{brl(m.custo)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="cartao">
        <div className="corpo" style={{ paddingTop: 16 }}>
          <details className="perigo-zona">
            <summary>Excluir esta formulação</summary>
            <p className="aviso">Apaga a mistura e sua composição. Os ingredientes continuam cadastrados.</p>
            <form action={excluir} style={{ marginTop: 12 }}>
              <input type="hidden" name="tabela" value="formulacoes" />
              <input type="hidden" name="id" value={formulacao.id} />
              <input type="hidden" name="ir" value="/racao" />
              <button className="perigo">Excluir {formulacao.nome}</button>
            </form>
          </details>
        </div>
      </div>
    </>
  )
}
