import { listarEquinos, listarLembretesEquinos, listarReproducoesEquinas, totalEquino } from '@/lib/dados'
import { brl, dia, hoje } from '@/lib/campos'
import { LinkTabela } from '../nav'
import { Vazio } from '../componentes'

export default async function Equinos() {
  const [equinos, reproducoes, lembretes] = await Promise.all([
    listarEquinos(),
    listarReproducoesEquinas(),
    listarLembretesEquinos(),
  ])
  const ativos = equinos.filter((e: any) => e.situacao === 'Ativo')
  const prenhezes = reproducoes.filter((r: any) => r.status === 'Prenhez confirmada')
  const nascidos = reproducoes.filter((r: any) => r.status === 'Parto realizado')
  const nomes = new Map(equinos.map((e: any) => [e.id, e.nome]))
  const proximosPartos = prenhezes
    .filter((r: any) => r.previsao_parto)
    .sort((a: any, b: any) => (a.previsao_parto < b.previsao_parto ? -1 : 1))
  const investido = ativos.reduce((s: number, e: any) => s + totalEquino(e), 0)
  const prazoRegistro = equinos
    .filter((e: any) => e.funcao_reprodutiva === 'Potro' && e.nascimento && e.status_registro === 'Sem registro')
    .map((e: any) => {
      const limite = new Date(`${e.nascimento}T12:00:00Z`)
      limite.setUTCDate(limite.getUTCDate() + 120)
      return { ...e, limite: limite.toISOString().slice(0, 10) }
    })
  const alertas = [
    ...lembretes.map((e: any) => ({ id: `evento-${e.id}`, equino_id: e.equino_id, nome: e.equinos?.nome, data: e.proxima_data, tipo: e.tipo, texto: e.descricao })),
    ...prazoRegistro.map((e: any) => ({ id: `registro-${e.id}`, equino_id: e.id, nome: e.nome, data: e.limite, tipo: 'Comunicação de nascimento', texto: 'Prazo de 120 dias a partir do nascimento' })),
  ].sort((a, b) => (a.data < b.data ? -1 : 1)).slice(0, 10)

  return (
    <>
      <h1>Criação Mangalarga Marchador</h1>
      <p className="sub">Plantel, genealogia, reprodução e custos dos seus equinos.</p>

      <div className="readout">
        <div><span className="n">{ativos.length}</span><span className="rotulo">Equinos ativos</span></div>
        <div><span className="n">{prenhezes.length}</span><span className="rotulo">Prenhezes confirmadas</span></div>
        <div><span className="n">{nascidos.length}</span><span className="rotulo">Partos registrados</span></div>
        <div className="destaque"><span className="n">{brl(investido)}</span><span className="rotulo">Investido no plantel</span></div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca"><h2>Agenda do criatório</h2></div>
        {!alertas.length ? (
          <Vazio titulo="Agenda em dia." dica="Próximos manejos e prazos de registro aparecem aqui." />
        ) : (
          <table><thead><tr><th>Data</th><th>Animal</th><th>Compromisso</th><th>Detalhe</th><th>Situação</th></tr></thead><tbody>
            {alertas.map((a: any) => <tr key={a.id}><td>{dia(a.data)}</td><td><LinkTabela href={`/equinos/${a.equino_id}`}>{a.nome ?? '—'}</LinkTabela></td><td>{a.tipo}</td><td>{a.texto ?? '—'}</td><td><span className={`etiqueta ${a.data < hoje() ? 'alerta' : ''}`}>{a.data < hoje() ? 'atrasado' : 'agendado'}</span></td></tr>)}
          </tbody></table>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Próximos partos</h2></div>
        {!proximosPartos.length ? (
          <Vazio titulo="Nenhum parto previsto." dica="Confirme uma prenhez e informe a previsão para acompanhar aqui." />
        ) : (
          <table>
            <thead><tr><th>Previsão</th><th>Matriz / doadora</th><th>Garanhão</th><th>Receptora</th><th>Estação</th></tr></thead>
            <tbody>
              {proximosPartos.map((r: any) => (
                <tr key={r.id}>
                  <td>{dia(r.previsao_parto)}{r.previsao_parto < hoje() && <span className="etiqueta alerta"> atrasado</span>}</td>
                  <td><LinkTabela href={`/equinos/${r.matriz_id}/reproducao`}>{nomes.get(r.matriz_id) ?? '—'}</LinkTabela></td>
                  <td>{(r.garanhao_id ? nomes.get(r.garanhao_id) : r.garanhao_nome) ?? '—'}</td>
                  <td>{r.receptora_id ? nomes.get(r.receptora_id) ?? '—' : '—'}</td>
                  <td>{r.estacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Plantel</h2></div>
        {!equinos.length ? (
          <Vazio titulo="Nenhum equino cadastrado." dica="Cadastre matrizes, garanhões, receptoras e animais de referência." />
        ) : (
          <table>
            <thead><tr><th>Animal</th><th>Função</th><th>Sexo</th><th>Registro ABCCMM</th><th>Andamento</th><th>Local</th><th>Situação</th><th className="num">Investido</th></tr></thead>
            <tbody>
              {equinos.map((e: any) => (
                <tr key={e.id}>
                  <td><LinkTabela href={`/equinos/${e.id}`}>{e.nome}</LinkTabela></td>
                  <td>{e.funcao_reprodutiva}</td>
                  <td>{e.sexo}</td>
                  <td>{e.registro_abccmm ?? '—'}</td>
                  <td>{e.andamento}</td>
                  <td>{e.localizacao ?? '—'}</td>
                  <td><span className={`etiqueta ${e.situacao !== 'Ativo' ? 'alerta' : ''}`}>{e.situacao}</span></td>
                  <td className="num">{brl(totalEquino(e))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
