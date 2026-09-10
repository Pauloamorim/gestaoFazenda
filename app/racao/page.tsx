import { listarFormulacoes, listarIngredientes } from '@/lib/dados'
import { brl, calcularMistura } from '@/lib/campos'
import { criarFormulacao } from '../actions'
import { Vazio } from '../componentes'
import { LinkTabela } from '../nav'

export default async function Formulacoes() {
  const [formulacoes, ingredientes] = await Promise.all([listarFormulacoes(), listarIngredientes()])

  return (
    <>
      <h1>Formulações</h1>
      <p className="sub">
        Suas misturas de ração. O custo sai da média ponderada das compras de cada ingrediente.
      </p>

      <div className="readout">
        <div>
          <span className="n">{formulacoes.length}</span>
          <span className="rotulo">Misturas</span>
        </div>
        <div>
          <span className="n">{ingredientes.length}</span>
          <span className="rotulo">Ingredientes</span>
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca">
          <h2>Nova formulação</h2>
        </div>
        <div className="corpo">
          <form action={criarFormulacao} className="linha">
            <label>
              Nome
              <input name="nome" required placeholder="Engorda 18% PB" />
            </label>
            <label className="larga">
              Observações
              <input name="observacoes" placeholder="Para que fase do gado, como fornecer" />
            </label>
            <button>Criar formulação</button>
          </form>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Suas misturas</h2>
        </div>
        {!formulacoes.length ? (
          <Vazio
            titulo="Nenhuma formulação ainda."
            dica="Cadastre os ingredientes primeiro, depois monte a mistura acima."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mistura</th>
                <th>Observações</th>
                <th className="num">Ingredientes</th>
                <th className="num">Batida</th>
                <th className="num">Custo médio/kg</th>
                <th className="num">Custo/tonelada</th>
              </tr>
            </thead>
            <tbody>
              {formulacoes.map((f: any) => {
                const m = calcularMistura(f.formulacao_itens)
                return (
                  <tr key={f.id}>
                    <td>
                      <LinkTabela href={`/racao/${f.id}`}>{f.nome}</LinkTabela>
                    </td>
                    <td>{f.observacoes ?? '—'}</td>
                    <td className="num">{f.formulacao_itens.length}</td>
                    <td className="num">{m.kg ? `${m.kg.toFixed(0)} kg` : '—'}</td>
                    <td className="num">{m.kg ? brl(m.custoKg) : '—'}</td>
                    <td className="num">{m.kg ? brl(m.custoTon) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
