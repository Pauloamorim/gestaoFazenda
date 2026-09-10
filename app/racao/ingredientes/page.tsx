import { listarIngredientes, listarLotes } from '@/lib/dados'
import { brl, cabecasAtivas, dia, hoje } from '@/lib/campos'
import { atribuirCompra, criarIngrediente, registrarCompra } from '../../actions'
import { Excluir, Vazio } from '../../componentes'

export default async function Ingredientes() {
  const [ingredientes, lotes] = await Promise.all([listarIngredientes(), listarLotes()])
  const lotesAtivos = lotes.filter(
    (l: any) => cabecasAtivas(l.quantidade, l.saidas ?? []) > 0,
  )

  // uma linha por compra, do mais recente para o mais antigo
  const compras = ingredientes
    .flatMap((i: any) => i.compras.map((c: any) => ({ ...c, ingrediente: i.nome })))
    .sort((a: any, b: any) => (a.data < b.data ? 1 : -1))

  const gastoTotal = ingredientes.reduce((s: number, i: any) => s + i.total_gasto, 0)

  return (
    <>
      <h1>Ingredientes</h1>
      <p className="sub">
        O preço fica na compra, não no ingrediente. O custo de cada item é a média ponderada do que
        você pagou.
      </p>

      <div className="readout">
        <div>
          <span className="n">{ingredientes.length}</span>
          <span className="rotulo">Ingredientes</span>
        </div>
        <div>
          <span className="n">{compras.length}</span>
          <span className="rotulo">Compras</span>
        </div>
        <div className="destaque">
          <span className="n">{brl(gastoTotal)}</span>
          <span className="rotulo">Gasto em insumos</span>
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca">
          <h2>Registrar compra</h2>
        </div>
        <div className="corpo">
          {!ingredientes.length ? (
            <p className="sub">Cadastre um ingrediente antes de lançar a primeira compra.</p>
          ) : !lotesAtivos.length ? (
            <p className="sub">Cadastre um lote ativo antes de lançar uma compra.</p>
          ) : (
            <form action={registrarCompra} className="linha">
              <label>
                Ingrediente
                <select name="ingrediente_id" required defaultValue="">
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {ingredientes.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Lote
                <select name="lote_id" required defaultValue={lotesAtivos.length === 1 ? lotesAtivos[0].id : ''}>
                  {lotesAtivos.length > 1 && (
                    <option value="" disabled>
                      Escolha…
                    </option>
                  )}
                  {lotesAtivos.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Data
                <input name="data" type="date" required defaultValue={hoje()} />
              </label>
              <label>
                Quantidade (kg)
                <input name="quantidade" type="number" min="0.001" step="any" required />
              </label>
              <label>
                Valor total (R$)
                <input name="valor_total" type="number" min="0" step="0.01" required />
              </label>
              <label>
                Fornecedor
                <input name="fornecedor" placeholder="Agropecuária Central" />
              </label>
              <button>Lançar compra</button>
            </form>
          )}
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Novo ingrediente</h2>
        </div>
        <div className="corpo">
          <form action={criarIngrediente} className="linha">
            <label>
              Nome
              <input name="nome" required placeholder="Milho moído" />
            </label>
            <label className="larga">
              Observações
              <input name="observacoes" placeholder="Teor de proteína, granulometria, onde guarda" />
            </label>
            <button>Cadastrar ingrediente</button>
          </form>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>
            Cadastrados <span className="etiqueta">{ingredientes.length}</span>
          </h2>
        </div>
        {!ingredientes.length ? (
          <Vazio
            titulo="Nenhum ingrediente cadastrado."
            dica="Comece pelo milho, farelo de soja e o núcleo mineral que você usa."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Observações</th>
                <th className="num">Comprado</th>
                <th className="num">Gasto</th>
                <th className="num">Custo médio/kg</th>
                <th className="num">Última compra</th>
                <th className="acao"></th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.map((i: any) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 500 }}>{i.nome}</td>
                  <td>{i.observacoes ?? '—'}</td>
                  <td className="num">{i.kg_comprado ? `${i.kg_comprado.toFixed(0)} kg` : '—'}</td>
                  <td className="num">{i.kg_comprado ? brl(i.total_gasto) : '—'}</td>
                  <td className="num">
                    {i.kg_comprado ? (
                      <strong>{brl(i.custo_kg)}</strong>
                    ) : (
                      <span className="etiqueta alerta">sem compra</span>
                    )}
                  </td>
                  <td className="num">{i.ultimo ? brl(i.ultimo) : '—'}</td>
                  <td className="acao">
                    <Excluir id={i.id} tabela="ingredientes" revalidar="/racao/ingredientes" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Histórico de compras</h2>
        </div>
        {!compras.length ? (
          <Vazio
            titulo="Nenhuma compra lançada."
            dica="Cada carga entra com seu próprio preço — é daí que sai o custo das misturas."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Ingrediente</th>
                <th>Fornecedor</th>
                <th>Lote</th>
                <th className="num">Quantidade</th>
                <th className="num">Valor total</th>
                <th className="num">R$/kg</th>
                <th className="acao"></th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c: any) => (
                <tr key={c.id}>
                  <td>{dia(c.data)}</td>
                  <td>{c.ingrediente}</td>
                  <td>{c.fornecedor ?? '—'}</td>
                  <td>
                    {c.lotes?.nome ?? (
                      <form action={atribuirCompra} className="linha" style={{ flexWrap: 'nowrap' }}>
                        <input type="hidden" name="id" value={c.id} />
                        <select name="lote_id" required defaultValue="" aria-label="Lote da compra">
                          <option value="" disabled>
                            Vincular…
                          </option>
                          {lotesAtivos.map((l: any) => (
                            <option key={l.id} value={l.id}>
                              {l.nome}
                            </option>
                          ))}
                        </select>
                        <button className="fantasma">Salvar</button>
                      </form>
                    )}
                  </td>
                  <td className="num">{Number(c.quantidade).toFixed(0)} kg</td>
                  <td className="num">{brl(Number(c.valor_total))}</td>
                  <td className="num">{brl(Number(c.valor_total) / Number(c.quantidade))}</td>
                  <td className="acao">
                    <Excluir id={c.id} tabela="compras_ingrediente" revalidar="/racao/ingredientes" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
