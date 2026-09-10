import { listarLotes, totalLote } from '@/lib/dados'
import { brl, cabecasAtivas, dia } from '@/lib/campos'
import { Vazio } from '../componentes'
import { LinkTabela } from '../nav'

export default async function Lotes() {
  const lotes = await listarLotes()
  const cabecasDe = (l: any) => cabecasAtivas(l.quantidade, l.saidas ?? [])
  const rebanho = lotes.reduce((s: number, l: any) => s + cabecasDe(l), 0)
  const capital = lotes.reduce((s: number, l: any) => s + totalLote(l), 0)

  return (
    <>
      <h1>Rebanho</h1>
      <p className="sub">Todo o dinheiro que está no pasto agora.</p>

      <div className="readout">
        <div>
          <span className="n">{lotes.length}</span>
          <span className="rotulo">Lotes ativos</span>
        </div>
        <div>
          <span className="n">{rebanho}</span>
          <span className="rotulo">Cabeças</span>
        </div>
        <div className="destaque">
          <span className="n">{brl(capital)}</span>
          <span className="rotulo">Capital investido</span>
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca">
          <h2>Lotes</h2>
        </div>
        {!lotes.length ? (
          <Vazio titulo="Nenhum lote ainda." dica="Cadastre o primeiro lote para começar a lançar custos e pesagens." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Lote</th>
                <th>Chegada</th>
                <th className="num">Cabeças</th>
                <th className="num">Cadastrados</th>
                <th className="num">Aquisição + frete</th>
                <th className="num">Investido</th>
                <th className="num">Por cabeça</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l: any) => (
                <tr key={l.id}>
                  <td>
                    <LinkTabela href={`/lotes/${l.id}`}>{l.nome}</LinkTabela>
                  </td>
                  <td>{dia(l.data_chegada)}</td>
                  <td className="num">{cabecasDe(l)}</td>
                  <td className="num">{l.animais.length}</td>
                  <td className="num">{brl(Number(l.custo_aquisicao) + Number(l.frete))}</td>
                  <td className="num">{brl(totalLote(l))}</td>
                  <td className="num">{cabecasDe(l) ? brl(totalLote(l) / cabecasDe(l)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
