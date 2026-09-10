import { notFound } from 'next/navigation'
import { carregarLote } from '@/lib/dados'
import { dia, hoje } from '@/lib/campos'
import { criarEvento } from '../../../actions'
import Link from 'next/link'
import { Brinco, Excluir, Vazio } from '../../../componentes'

const TIPOS = ['Pesagem', 'Vacina', 'Vermífugo', 'Medicação', 'Doença', 'Morte', 'Venda', 'Outro']

export default async function Sanidade({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarLote(id)
  if (!dados) notFound()
  const { animais, eventos } = dados

  return (
    <>
      <div className="cartao">
        <div className="cabeca">
          <h2>Vacinar o lote inteiro</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            Um registro que vale para todos os animais. O custo, se houver, lance na aba Custos.
          </p>
        </div>
        <div className="corpo">
          <form action={criarEvento} className="linha">
            <input type="hidden" name="lote_id" value={id} />
            <input type="hidden" name="tipo" value="Vacina" />
            <label className="larga">
              Vacina
              <input name="descricao" required placeholder="Aftosa — 2ª dose" />
            </label>
            <label>
              Data
              <input name="data" type="date" required defaultValue={hoje()} />
            </label>
            <button>Registrar vacinação</button>
          </form>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Pesagem ou ocorrência</h2>
        </div>
        <div className="corpo">
          <form action={criarEvento} className="linha">
            <input type="hidden" name="lote_id" value={id} />
            <label>
              Animal
              <select name="animal_id" defaultValue="">
                <option value="">Lote inteiro</option>
                {animais.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.identificacao}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <input name="tipo" list="tipos" required defaultValue="Pesagem" />
            </label>
            <datalist id="tipos">
              {TIPOS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <label>
              Peso (kg)
              <input name="peso" type="number" min="0.001" step="any" />
            </label>
            <label className="larga">
              Descrição
              <input name="descricao" placeholder="O que aconteceu" />
            </label>
            <label>
              Data
              <input name="data" type="date" required defaultValue={hoje()} />
            </label>
            <button>Registrar</button>
          </form>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Últimos registros</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            Os 5 mais recentes. A linha do tempo completa fica na aba{' '}
            <Link href={`/lotes/${id}/historico`}>Histórico</Link>.
          </p>
        </div>
        {!eventos.length ? (
          <Vazio titulo="Histórico vazio." dica="Cada vacina, pesagem e ocorrência fica registrada aqui, com data." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Animal</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th className="num">Peso</th>
                <th className="acao"></th>
              </tr>
            </thead>
            <tbody>
              {eventos.slice(0, 5).map((e: any) => (
                <tr key={e.id}>
                  <td>{dia(e.data)}</td>
                  <td>
                    <Brinco
                      id={e.animais?.identificacao}
                      href={e.animal_id ? `/lotes/${id}/animais/${e.animal_id}` : undefined}
                    />
                  </td>
                  <td>
                    <span className="etiqueta">{e.tipo}</span>
                  </td>
                  <td>{e.descricao ?? '—'}</td>
                  <td className="num">{e.peso ? `${e.peso} kg` : '—'}</td>
                  <td className="acao">
                    <Excluir id={e.id} tabela="eventos" revalidar={`/lotes/${id}`} />
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
