import { brl, dia, hoje } from '@/lib/campos'
import { listarCustosEquinos, listarEquinos } from '@/lib/dados'
import { CATEGORIAS_CUSTO_EQUINO } from '@/lib/equinos'
import { criarCustoEquinos } from '../../actions'
import { Excluir, Vazio } from '../../componentes'
import { LinkTabela } from '../../nav'

export default async function CustosEquinos() {
  const [equinos, custos] = await Promise.all([listarEquinos(), listarCustosEquinos()])
  const disponiveis = equinos.filter((e: any) => e.situacao === 'Ativo')
  const mesAtual = hoje().slice(0, 7)
  const total = custos.reduce((s: number, c: any) => s + Number(c.valor), 0)
  const totalMes = custos
    .filter((c: any) => c.data.startsWith(mesAtual))
    .reduce((s: number, c: any) => s + Number(c.valor), 0)
  const porCategoria = new Map<string, number>()
  for (const c of custos)
    porCategoria.set(c.categoria, (porCategoria.get(c.categoria) ?? 0) + Number(c.valor))

  return (
    <>
      <h1>Custos dos equinos</h1>
      <p className="sub">Ração, veterinário, medicamentos e outros gastos atribuídos ao animal correto.</p>

      <div className="readout">
        <div><span className="n">{brl(totalMes)}</span><span className="rotulo">Neste mês</span></div>
        <div><span className="n">{brl(total)}</span><span className="rotulo">Total lançado</span></div>
        <div className="destaque"><span className="n">{custos.length}</span><span className="rotulo">Lançamentos</span></div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca">
          <h2>Lançar despesa</h2>
          <p className="sub" style={{ marginTop: -6 }}>Selecione um animal para um custo individual ou vários para dividir o valor total igualmente.</p>
        </div>
        <div className="corpo">
          {!disponiveis.length ? (
            <Vazio titulo="Nenhum equino ativo." dica="Cadastre um equino antes de lançar despesas." />
          ) : (
            <form action={criarCustoEquinos} className="linha">
              <fieldset className="selecao-equinos">
                <legend>Equinos envolvidos</legend>
                <div className="grade-selecao-equinos">
                  {disponiveis.map((e: any) => (
                    <label className="check-equino" key={e.id}>
                      <input type="checkbox" name="equino_ids" value={e.id} />
                      <span><strong>{e.nome}</strong><small>{e.funcao_reprodutiva}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>Categoria<input name="categoria" list="categorias-custo-equino" required /></label>
              <datalist id="categorias-custo-equino">{CATEGORIAS_CUSTO_EQUINO.map((x) => <option key={x} value={x} />)}</datalist>
              <label>Data<input name="data" type="date" required defaultValue={hoje()} /></label>
              <label>Valor total (R$)<input name="valor" type="number" min="0.01" step="0.01" required /></label>
              <label className="larga">Descrição<input name="descricao" placeholder="Ex.: compra de ração do mês" /></label>
              <button>Lançar despesa</button>
            </form>
          )}
        </div>
      </div>

      {!!porCategoria.size && (
        <div className="cartao">
          <div className="cabeca"><h2>Por categoria</h2></div>
          <table><thead><tr><th>Categoria</th><th className="num">Valor</th></tr></thead><tbody>
            {[...porCategoria].sort((a, b) => b[1] - a[1]).map(([categoria, valor]) => <tr key={categoria}><td>{categoria}</td><td className="num">{brl(valor)}</td></tr>)}
          </tbody></table>
        </div>
      )}

      <div className="cartao">
        <div className="cabeca"><h2>Lançamentos</h2></div>
        {!custos.length ? (
          <Vazio titulo="Nenhum custo lançado." dica="As despesas do plantel aparecerão aqui e na ficha de cada animal." />
        ) : (
          <table><thead><tr><th>Data</th><th>Animal</th><th>Categoria</th><th>Descrição</th><th>Ciclo</th><th className="num">Valor atribuído</th><th className="acao"></th></tr></thead><tbody>
            {custos.map((c: any) => <tr key={c.id}>
              <td>{dia(c.data)}</td>
              <td><LinkTabela href={`/equinos/${c.equino_id}/custos`}>{c.equinos?.nome ?? '—'}</LinkTabela></td>
              <td><span className="etiqueta">{c.categoria}</span></td>
              <td>{c.descricao ?? '—'}</td>
              <td>{c.reproducoes_equinas?.estacao ?? '—'}</td>
              <td className="num">{brl(Number(c.valor))}</td>
              <td className="acao"><Excluir id={c.id} tabela="custos_equinos" revalidar="/equinos/custos" /></td>
            </tr>)}
            <tr className="total"><td colSpan={5}>Total lançado</td><td className="num">{brl(total)}</td><td></td></tr>
          </tbody></table>
        )}
      </div>
    </>
  )
}
