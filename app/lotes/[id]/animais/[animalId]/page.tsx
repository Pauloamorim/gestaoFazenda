import Link from 'next/link'
import { notFound } from 'next/navigation'
import { carregarLote } from '@/lib/dados'
import { dia, diasEntre, ganhoDiario } from '@/lib/campos'
import { Vazio } from '../../../../componentes'
import { GraficoSerie } from '../../../../grafico'

export default async function Animal({ params }: { params: Promise<{ id: string; animalId: string }> }) {
  const { id, animalId } = await params
  const dados = await carregarLote(id)
  if (!dados) notFound()
  const { lote, animais, eventos } = dados

  const animal = animais.find((a: any) => a.id === animalId)
  if (!animal) notFound()

  // o que aconteceu com este animal: os registros dele + os que valeram para o lote todo
  const historico = eventos
    .filter((e: any) => !e.animal_id || e.animal_id === animalId)
    .map((e: any) => ({ ...e, doLote: !e.animal_id }))

  const pesagens = historico
    .filter((e: any) => e.peso && !e.doLote)
    .map((e: any) => ({ data: e.data, peso: Number(e.peso) }))
    .sort((a: any, b: any) => (a.data < b.data ? -1 : 1))

  const inicial = Number(animal.peso_inicial) || 0
  const atual = pesagens.length ? pesagens[pesagens.length - 1].peso : inicial
  const dataAtual = pesagens.length ? pesagens[pesagens.length - 1].data : lote.data_chegada
  const gmd = inicial ? ganhoDiario(inicial, atual, lote.data_chegada, dataAtual) : 0
  const dias = diasEntre(lote.data_chegada, dataAtual)

  // sequência de pesagens partindo do peso de entrada, para calcular cada intervalo
  const serie = inicial ? [{ data: lote.data_chegada, peso: inicial, entrada: true }, ...pesagens] : pesagens

  return (
    <>
      <p className="sub" style={{ marginBottom: 6 }}>
        <Link href={`/lotes/${id}/animais`}>← Animais do lote</Link>
      </p>

      <div className="ficha">
        <span className="brinco grande">{animal.identificacao}</span>
        <div>
          <p className="sub" style={{ margin: 0 }}>
            {animal.caracteristicas ?? 'Sem características anotadas'}
            {animal.idade_meses ? ` · ${animal.idade_meses} meses na entrada` : ''}
          </p>
        </div>
      </div>

      <div className="readout">
        <div>
          <span className="n">{inicial ? `${inicial}` : '—'}</span>
          <span className="rotulo">Peso de entrada (kg)</span>
        </div>
        <div>
          <span className="n">{atual ? `${atual}` : '—'}</span>
          <span className="rotulo">Peso atual (kg)</span>
        </div>
        <div>
          <span className="n">
            {inicial && atual ? `${atual - inicial > 0 ? '+' : ''}${(atual - inicial).toFixed(1)}` : '—'}
          </span>
          <span className="rotulo">Ganho total (kg)</span>
        </div>
        <div className="destaque">
          <span className="n">{gmd ? gmd.toFixed(3).replace('.', ',') : '—'}</span>
          <span className="rotulo">Ganho por dia (kg)</span>
        </div>
        <div>
          <span className="n">{dias || '—'}</span>
          <span className="rotulo">Dias no lote</span>
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca">
          <h2>Pesagens</h2>
        </div>
        {serie.length >= 2 && (
          <GraficoSerie serie={serie.map((p: any) => ({ data: p.data, valor: p.peso }))} sufixo=" kg" />
        )}
        {serie.length < 2 ? (
          <Vazio
            titulo="Ainda sem pesagem registrada."
            dica="Lance uma pesagem na aba Sanidade e peso para acompanhar o ganho deste animal."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th className="num">Peso</th>
                <th className="num">Desde a anterior</th>
                <th className="num">Dias</th>
                <th className="num">Ganho por dia</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((p: any, i: number) => {
                const ant = i ? serie[i - 1] : null
                const delta = ant ? p.peso - ant.peso : null
                const d = ant ? diasEntre(ant.data, p.data) : 0
                return (
                  <tr key={`${p.data}-${i}`}>
                    <td>
                      {dia(p.data)} {p.entrada && <span className="etiqueta">entrada</span>}
                    </td>
                    <td className="num">{p.peso} kg</td>
                    <td className={`num ${delta === null ? '' : delta >= 0 ? 'ganho' : 'perda'}`}>
                      {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`}
                    </td>
                    <td className="num">{ant ? d : '—'}</td>
                    <td className="num">
                      {ant && d > 0 ? `${(delta! / d).toFixed(3).replace('.', ',')} kg` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Histórico do animal</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            Os registros dele e também os que valeram para o lote inteiro.
          </p>
        </div>
        {!historico.length ? (
          <Vazio titulo="Nada registrado ainda." dica="Vacinas do lote e ocorrências individuais aparecem aqui." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Alcance</th>
                <th>Descrição</th>
                <th className="num">Peso</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((e: any) => (
                <tr key={e.id}>
                  <td>{dia(e.data)}</td>
                  <td>
                    <span className="etiqueta">{e.tipo}</span>
                  </td>
                  <td>
                    {e.doLote ? (
                      <span className="etiqueta">lote inteiro</span>
                    ) : (
                      <span className="etiqueta destaque-etiqueta">este animal</span>
                    )}
                  </td>
                  <td>{e.descricao ?? '—'}</td>
                  <td className="num">{e.peso ? `${e.peso} kg` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
