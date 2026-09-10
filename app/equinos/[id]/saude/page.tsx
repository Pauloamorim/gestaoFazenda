import { notFound } from 'next/navigation'
import { carregarEquino } from '@/lib/dados'
import { dia, hoje } from '@/lib/campos'
import { criarEventoEquino } from '../../../actions'
import { Excluir, Vazio } from '../../../componentes'

const TIPOS = ['Vacina', 'Vermífugo', 'Veterinário', 'Ultrassom', 'Exame reprodutivo', 'Medicação', 'Doença / lesão', 'Ferrageamento', 'Casqueamento', 'Odontologia', 'Pesagem', 'Treinamento', 'Outro']

export default async function SaudeEquino({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarEquino(id)
  if (!dados) notFound()
  const { eventos, reproducoes } = dados

  return (
    <>
      <div className="cartao">
        <div className="cabeca"><h2>Registrar saúde ou manejo</h2><p className="sub" style={{ marginTop: -6 }}>Use “próxima data” para criar o lembrete de vacina, ferrageamento, exame ou outro cuidado.</p></div>
        <div className="corpo">
          <form action={criarEventoEquino} className="linha">
            <input type="hidden" name="equino_id" value={id} />
            <label>Tipo<input name="tipo" list="tipos-equino" required /></label>
            <datalist id="tipos-equino">{TIPOS.map((x) => <option key={x} value={x} />)}</datalist>
            <label>Data<input name="data" type="date" required defaultValue={hoje()} /></label>
            <label>Próxima data<input name="proxima_data" type="date" /></label>
            <label>Peso (kg)<input name="peso" type="number" min="0.001" step="any" /></label>
            <label>Ciclo reprodutivo<select name="reproducao_id" defaultValue=""><option value="">Não relacionado</option>{reproducoes.map((r: any) => <option key={r.id} value={r.id}>{r.estacao} · {r.metodo}</option>)}</select></label>
            <label className="larga">Descrição<input name="descricao" placeholder="Procedimento, produto, dose, profissional ou resultado" /></label>
            <button>Registrar</button>
          </form>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Saúde e manejo</h2></div>
        {!eventos.length ? (
          <Vazio titulo="Nenhum manejo registrado." dica="Vacinas, exames, pesagens e cuidados aparecem aqui." />
        ) : (
          <table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th className="num">Peso</th><th>Próxima data</th><th className="acao"></th></tr></thead><tbody>
            {eventos.map((e: any) => <tr key={e.id}>
              <td>{dia(e.data)}</td><td><span className="etiqueta">{e.tipo}</span></td><td>{e.descricao ?? '—'}</td><td className="num">{e.peso ? `${e.peso} kg` : '—'}</td><td>{e.proxima_data ? <span className={e.proxima_data < hoje() ? 'perda' : ''}>{dia(e.proxima_data)}</span> : '—'}</td><td className="acao"><Excluir id={e.id} tabela="eventos_equinos" revalidar={`/equinos/${id}`} /></td>
            </tr>)}
          </tbody></table>
        )}
      </div>
    </>
  )
}
