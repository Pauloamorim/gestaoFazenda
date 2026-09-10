import { notFound } from 'next/navigation'
import { carregarEquino } from '@/lib/dados'
import { brl, dia, hoje } from '@/lib/campos'
import { criarCustoEquino } from '../../../actions'
import { Excluir, Vazio } from '../../../componentes'

const CATEGORIAS = ['Alimentação', 'Veterinário', 'Medicamento', 'Sêmen / cobertura', 'Coleta', 'Inseminação', 'Transferência de embrião', 'Receptora', 'Ultrassom / diagnóstico', 'DNA / registro', 'Ferrageamento', 'Transporte', 'Treinamento', 'Outro']

export default async function CustosEquino({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarEquino(id)
  if (!dados) notFound()
  const { equino, custos, reproducoes, gastos, investido } = dados
  const porCategoria = new Map<string, number>()
  for (const c of custos) porCategoria.set(c.categoria, (porCategoria.get(c.categoria) ?? 0) + Number(c.valor))

  return (
    <>
      <div className="readout">
        <div><span className="n">{brl(Number(equino.valor_aquisicao))}</span><span className="rotulo">Aquisição</span></div>
        <div><span className="n">{brl(gastos)}</span><span className="rotulo">Custos adicionais</span></div>
        <div className="destaque"><span className="n">{brl(investido)}</span><span className="rotulo">Total investido</span></div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca"><h2>Lançar custo</h2></div>
        <div className="corpo"><form action={criarCustoEquino} className="linha">
          <input type="hidden" name="equino_id" value={id} />
          <label>Categoria<input name="categoria" list="categorias-equino" required /></label>
          <datalist id="categorias-equino">{CATEGORIAS.map((x) => <option key={x} value={x} />)}</datalist>
          <label>Data<input name="data" type="date" required defaultValue={hoje()} /></label>
          <label>Valor (R$)<input name="valor" type="number" min="0" step="0.01" required /></label>
          <label>Ciclo reprodutivo<select name="reproducao_id" defaultValue=""><option value="">Não relacionado</option>{reproducoes.map((r: any) => <option key={r.id} value={r.id}>{r.estacao} · {r.metodo}</option>)}</select></label>
          <label className="larga">Descrição<input name="descricao" /></label>
          <button>Lançar custo</button>
        </form></div>
      </div>

      {!!porCategoria.size && <div className="cartao"><div className="cabeca"><h2>Por categoria</h2></div><table><thead><tr><th>Categoria</th><th className="num">Valor</th></tr></thead><tbody>{[...porCategoria].sort((a, b) => b[1] - a[1]).map(([categoria, valor]) => <tr key={categoria}><td>{categoria}</td><td className="num">{brl(valor)}</td></tr>)}</tbody></table></div>}

      <div className="cartao"><div className="cabeca"><h2>Lançamentos</h2></div>
        {!custos.length ? <Vazio titulo="Nenhum custo lançado." dica="Custos reprodutivos e de manutenção ficam associados ao animal." /> : <table><thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Ciclo</th><th className="num">Valor</th><th className="acao"></th></tr></thead><tbody>
          {custos.map((c: any) => <tr key={c.id}><td>{dia(c.data)}</td><td><span className="etiqueta">{c.categoria}</span></td><td>{c.descricao ?? '—'}</td><td>{c.reproducoes_equinas?.estacao ?? '—'}</td><td className="num">{brl(Number(c.valor))}</td><td className="acao"><Excluir id={c.id} tabela="custos_equinos" revalidar={`/equinos/${id}`} /></td></tr>)}
          <tr className="total"><td colSpan={4}>Total lançado</td><td className="num">{brl(gastos)}</td><td></td></tr>
        </tbody></table>}
      </div>
    </>
  )
}
