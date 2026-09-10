import { notFound } from 'next/navigation'
import { carregarLote, historicoPraca } from '@/lib/dados'
import { brl, dia, emArrobas, hoje } from '@/lib/campos'
import { nomeCategoria } from '@/lib/cotacoes'
import { registrarSaida } from '../../../actions'
import { Brinco, Excluir, Vazio } from '../../../componentes'

const TIPOS = ['Venda', 'Morte', 'Roubo', 'Outro']

export default async function Saidas({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarLote(id)
  if (!dados) notFound()
  const { lote, ativos, saidas, investido, receita, cabecas, pesoMedio } = dados

  const categoria = lote.categoria ?? 'novilha_gorda'
  const historico = lote.praca ? await historicoPraca(categoria, lote.praca) : []
  const arroba = historico.length ? Number(historico[historico.length - 1].vista) : 0

  // o que ainda está no pasto, avaliado pela cotação de hoje
  const arrobasNoPasto = cabecas * emArrobas(pesoMedio, Number(lote.rendimento))
  const estimado = arrobasNoPasto * arroba
  const resultado = receita + estimado - investido
  const mortes = saidas
    .filter((s: any) => s.tipo === 'Morte')
    .reduce((s: number, x: any) => s + x.quantidade, 0)

  return (
    <>
      <div className="readout">
        <div>
          <span className="n">{cabecas}</span>
          <span className="rotulo">Ainda no pasto</span>
        </div>
        <div>
          <span className="n">{lote.quantidade - cabecas}</span>
          <span className="rotulo">Saíram{mortes ? ` · ${mortes} morte(s)` : ''}</span>
        </div>
        <div>
          <span className="n">{brl(receita)}</span>
          <span className="rotulo">Receita realizada</span>
        </div>
        <div>
          <span className="n">{arroba ? brl(estimado) : '—'}</span>
          <span className="rotulo">
            {arroba ? `${arrobasNoPasto.toFixed(1)} @ no pasto` : 'Escolha a praça no Resumo'}
          </span>
        </div>
        <div className="destaque">
          <span className="n">{arroba || receita ? brl(resultado) : '—'}</span>
          <span className="rotulo">Resultado projetado</span>
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca">
          <h2>Dar baixa</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            Venda, morte ou perda. Isso desconta do rebanho e corrige o custo por cabeça —
            escolher um animal identificado dá baixa de uma cabeça só.
          </p>
        </div>
        <div className="corpo">
          <form action={registrarSaida} className="linha">
            <input type="hidden" name="lote_id" value={id} />
            <label>
              Tipo
              <select name="tipo" required defaultValue="Venda">
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Data
              <input name="data" type="date" required defaultValue={hoje()} />
            </label>
            <label>
              Animal (opcional)
              <select name="animal_id" defaultValue="">
                <option value="">Sem identificar</option>
                {ativos.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.identificacao}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cabeças
              <input name="quantidade" type="number" min="1" step="1" defaultValue="1" />
            </label>
            <label>
              Peso total (kg)
              <input name="peso_total" type="number" min="0.001" step="any" />
            </label>
            <label>
              Valor recebido (R$)
              <input name="valor_total" type="number" min="0" step="0.01" />
            </label>
            <label className="larga">
              Observações
              <input name="descricao" placeholder="Comprador, frigorífico, causa da morte" />
            </label>
            <button>Registrar baixa</button>
          </form>
          <p className="sub" style={{ marginTop: 10 }}>
            Escolhendo um animal, a quantidade vale 1 e ele sai das médias de peso e ganho.
          </p>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Baixas do lote</h2>
        </div>
        {!saidas.length ? (
          <Vazio
            titulo="Nenhuma baixa registrada."
            dica={`As ${lote.quantidade} cabeças da compra continuam todas no pasto.`}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Animal</th>
                <th className="num">Cabeças</th>
                <th className="num">Peso</th>
                <th className="num">Valor</th>
                <th className="num">Por @</th>
                <th>Observações</th>
                <th className="acao"></th>
              </tr>
            </thead>
            <tbody>
              {saidas.map((s: any) => {
                const arrobas = s.peso_total ? emArrobas(Number(s.peso_total), Number(lote.rendimento)) : 0
                return (
                  <tr key={s.id}>
                    <td>{dia(s.data)}</td>
                    <td>
                      <span className={`etiqueta ${s.tipo === 'Morte' ? 'alerta' : ''}`}>{s.tipo}</span>
                    </td>
                    <td>{s.animal_id ? <Brinco id={s.animais?.identificacao} /> : '—'}</td>
                    <td className="num">{s.quantidade}</td>
                    <td className="num">{s.peso_total ? `${Number(s.peso_total).toFixed(0)} kg` : '—'}</td>
                    <td className="num">{s.valor_total ? brl(Number(s.valor_total)) : '—'}</td>
                    <td className="num">
                      {s.valor_total && arrobas ? brl(Number(s.valor_total) / arrobas) : '—'}
                    </td>
                    <td>{s.descricao ?? '—'}</td>
                    <td className="acao">
                      <Excluir id={s.id} tabela="saidas" revalidar={`/lotes/${id}`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {arroba > 0 && (
        <p className="sub">
          O que resta no pasto está avaliado pela cotação de {nomeCategoria(categoria)} em{' '}
          {lote.praca} ({brl(arroba)}/@), com {Number(lote.rendimento).toFixed(0)}% de rendimento.
          É estimativa, não venda fechada.
        </p>
      )}
    </>
  )
}
