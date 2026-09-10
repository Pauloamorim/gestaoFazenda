import { notFound } from 'next/navigation'
import { carregarLote } from '@/lib/dados'
import { criarAnimal } from '../../../actions'
import { Brinco, Excluir, Vazio } from '../../../componentes'

export default async function Animais({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarLote(id)
  if (!dados) notFound()
  const { animais, ultimoPeso } = dados

  return (
    <>
      <div className="cartao">
        <div className="cabeca">
          <h2>Novo animal</h2>
        </div>
        <div className="corpo">
          <form action={criarAnimal} className="linha">
            <input type="hidden" name="lote_id" value={id} />
            <label>
              Brinco
              <input name="identificacao" required placeholder="1042" />
            </label>
            <label className="larga">
              Características
              <input name="caracteristicas" placeholder="Nelore, macho, mocho" />
            </label>
            <label>
              Peso inicial (kg)
              <input name="peso_inicial" type="number" min="0.001" step="any" />
            </label>
            <label>
              Idade (meses)
              <input name="idade_meses" type="number" min="0" step="1" />
            </label>
            <button>Adicionar animal</button>
          </form>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>
            No lote <span className="etiqueta">{animais.length}</span>
          </h2>
        </div>
        {!animais.length ? (
          <Vazio titulo="Nenhum animal com brinco." dica="Cadastre acima para acompanhar peso e ganho por cabeça." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Brinco</th>
                <th>Características</th>
                <th className="num">Idade</th>
                <th className="num">Peso inicial</th>
                <th className="num">Peso atual</th>
                <th className="num">Ganho</th>
                <th className="acao"></th>
              </tr>
            </thead>
            <tbody>
              {animais.map((a: any) => {
                const atual = ultimoPeso.get(a.id)
                const ganho = atual && a.peso_inicial ? atual.peso - Number(a.peso_inicial) : null
                return (
                  <tr key={a.id}>
                    <td>
                      <Brinco id={a.identificacao} href={`/lotes/${id}/animais/${a.id}`} />
                    </td>
                    <td>{a.caracteristicas ?? '—'}</td>
                    <td className="num">{a.idade_meses ? `${a.idade_meses} m` : '—'}</td>
                    <td className="num">{a.peso_inicial ? `${a.peso_inicial} kg` : '—'}</td>
                    <td className="num">{atual ? `${atual.peso} kg` : '—'}</td>
                    <td className={`num ${ganho === null ? '' : ganho >= 0 ? 'ganho' : 'perda'}`}>
                      {ganho === null ? '—' : `${ganho > 0 ? '+' : ''}${ganho.toFixed(1)} kg`}
                    </td>
                    <td className="acao">
                      <Excluir id={a.id} tabela="animais" revalidar={`/lotes/${id}`} />
                    </td>
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
