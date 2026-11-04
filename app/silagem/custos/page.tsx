import { brl, dia, hoje } from '@/lib/campos'
import { listarAreasSilagem, listarCustosSilagem, listarMovimentosSilagem } from '@/lib/dados'
import { CATEGORIAS_CUSTO_SILAGEM, custoPorSaco } from '@/lib/silagem'
import { criarCustoSilagem } from '../../actions'
import { Excluir, Vazio } from '../../componentes'

export default async function CustosSilagem() {
  const [areas, custos, movimentos] = await Promise.all([
    listarAreasSilagem(),
    listarCustosSilagem(),
    listarMovimentosSilagem(),
  ])
  const c = custoPorSaco(custos, movimentos)
  const mesAtual = hoje().slice(0, 7)
  const totalMes = custos
    .filter((x: any) => x.data.startsWith(mesAtual))
    .reduce((s: number, x: any) => s + Number(x.valor), 0)
  const porCategoria = new Map<string, number>()
  for (const x of custos) porCategoria.set(x.categoria, (porCategoria.get(x.categoria) ?? 0) + Number(x.valor))

  return (
    <>
      <h1>Custos da silagem</h1>
      <p className="sub">
        Sacos, combustível, mão de obra, adubo. O custo por saco conta só a produção feita a partir do
        primeiro custo lançado; custo sem área é dividido entre as áreas pela produção de cada uma.
      </p>

      <div className="readout">
        <div className="destaque">
          <span className="n">{c.sacos ? brl(c.geral) : '—'}</span>
          <span className="rotulo">Custo por saco</span>
        </div>
        <div><span className="n">{c.sacos}</span><span className="rotulo">{c.desde ? `Sacos desde ${dia(c.desde)}` : 'Sacos no período'}</span></div>
        <div><span className="n">{brl(totalMes)}</span><span className="rotulo">Neste mês</span></div>
        <div><span className="n">{brl(c.total)}</span><span className="rotulo">Total lançado</span></div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca"><h2>Lançar custo</h2></div>
        <div className="corpo">
          <form action={criarCustoSilagem} className="linha">
            <label>Data<input name="data" type="date" required defaultValue={hoje()} /></label>
            <label>Categoria<input name="categoria" list="categorias-custo-silagem" required /></label>
            <datalist id="categorias-custo-silagem">{CATEGORIAS_CUSTO_SILAGEM.map((x) => <option key={x} value={x} />)}</datalist>
            <label>Área
              <select name="area_id" defaultValue="">
                <option value="">Geral (todas as áreas)</option>
                {areas.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </label>
            <label>Valor (R$)<input name="valor" type="number" min="0.01" step="0.01" required /></label>
            <label className="larga">Descrição<input name="descricao" placeholder="Ex.: 500 sacos plásticos" /></label>
            <button>Lançar custo</button>
          </form>
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
          <Vazio titulo="Nenhum custo lançado." dica="Lance o que gasta para produzir a silagem e o custo por saco aparece sozinho." />
        ) : (
          <table><thead><tr><th>Data</th><th>Categoria</th><th>Área</th><th>Descrição</th><th className="num">Valor</th><th className="acao"></th></tr></thead><tbody>
            {custos.map((x: any) => <tr key={x.id}>
              <td>{dia(x.data)}</td>
              <td><span className="etiqueta">{x.categoria}</span></td>
              <td>{x.silagem_areas?.nome ?? 'Geral'}</td>
              <td>{x.descricao ?? '—'}</td>
              <td className="num">{brl(Number(x.valor))}</td>
              <td className="acao"><Excluir id={x.id} tabela="silagem_custos" revalidar="/silagem" /></td>
            </tr>)}
            <tr className="total"><td colSpan={4}>Total lançado</td><td className="num">{brl(c.total)}</td><td></td></tr>
          </tbody></table>
        )}
      </div>
    </>
  )
}
