import Link from 'next/link'
import { brl, dia, hoje } from '@/lib/campos'
import { listarAreasSilagem, listarCustosSilagem, listarDepositosSilagem, listarMovimentosSilagem } from '@/lib/dados'
import { custoPorSaco, saldoPorDeposito } from '@/lib/silagem'
import { registrarProducaoSilagem, registrarUsoSilagem } from '../actions'
import { Excluir, Vazio } from '../componentes'

const TIPO = { producao: 'Produção', uso: 'Uso', saldo_inicial: 'Saldo inicial' } as Record<string, string>

export default async function Silagem() {
  const [areas, depositos, movimentos, custos] = await Promise.all([
    listarAreasSilagem(),
    listarDepositosSilagem(),
    listarMovimentosSilagem(),
    listarCustosSilagem(),
  ])
  const saldo = saldoPorDeposito(movimentos)
  const estoque = [...saldo.values()].reduce((s, n) => s + n, 0)
  const soma = (tipo: string) => movimentos.filter((m: any) => m.tipo === tipo).reduce((s: number, m: any) => s + m.sacos, 0)
  const custo = custoPorSaco(custos, movimentos)
  const producaoArea = new Map<string, number>()
  for (const m of movimentos)
    if (m.tipo === 'producao') producaoArea.set(m.area_id, (producaoArea.get(m.area_id) ?? 0) + m.sacos)

  return (
    <>
      <h1>Silagem</h1>
      <p className="sub">Produção diária por área, uso por depósito e o estoque de sacos que sobra.</p>

      <div className="readout">
        <div className="destaque"><span className="n">{estoque}</span><span className="rotulo">Sacos em estoque</span></div>
        <div><span className="n">{soma('producao')}</span><span className="rotulo">Produzidos</span></div>
        <div><span className="n">{soma('uso')}</span><span className="rotulo">Usados</span></div>
        <div>
          <span className="n">{custo.sacos ? brl(custo.geral) : '—'}</span>
          <span className="rotulo">{custo.desde ? `Custo/saco desde ${dia(custo.desde)}` : 'Custo/saco'}</span>
        </div>
      </div>

      {!areas.length || !depositos.length ? (
        <div className="cartao" style={{ marginTop: 22 }}>
          <Vazio
            titulo="Cadastre áreas e depósitos primeiro."
            dica={<>Em <Link href="/silagem/cadastros">Áreas e depósitos</Link>, registre de onde a silagem vem e onde ela fica guardada.</>}
          />
        </div>
      ) : (
        <>
          <div className="cartao" style={{ marginTop: 22 }}>
            <div className="cabeca"><h2>Registrar produção</h2></div>
            <div className="corpo">
              <form action={registrarProducaoSilagem} className="linha">
                <label>Data<input name="data" type="date" required defaultValue={hoje()} /></label>
                <label>Área<select name="area_id" required>{areas.map((a: any) => <option key={a.id} value={a.id}>{a.nome} · {a.cultura}</option>)}</select></label>
                <label>Depósito<select name="deposito_id" required>{depositos.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></label>
                <label>Sacos<input name="sacos" type="number" min="1" step="1" required /></label>
                <label className="larga">Observações<input name="observacoes" /></label>
                <button>Registrar produção</button>
              </form>
            </div>
          </div>

          <div className="cartao">
            <div className="cabeca"><h2>Registrar uso</h2></div>
            <div className="corpo">
              <form action={registrarUsoSilagem} className="linha">
                <label>Data<input name="data" type="date" required defaultValue={hoje()} /></label>
                <label>Depósito<select name="deposito_id" required>{depositos.map((d: any) => <option key={d.id} value={d.id}>{d.nome} · {saldo.get(d.id) ?? 0} sacos</option>)}</select></label>
                <label>Sacos<input name="sacos" type="number" min="1" step="1" required /></label>
                <label className="larga">Observações<input name="observacoes" placeholder="Ex.: trato do lote 3" /></label>
                <button>Registrar uso</button>
              </form>
            </div>
          </div>
        </>
      )}

      {!!depositos.length && (
        <div className="cartao">
          <div className="cabeca"><h2>Estoque por depósito</h2></div>
          <table><thead><tr><th>Depósito</th><th className="num">Sacos</th></tr></thead><tbody>
            {depositos.map((d: any) => <tr key={d.id}><td>{d.nome}</td><td className="num">{saldo.get(d.id) ?? 0}</td></tr>)}
            <tr className="total"><td>Total</td><td className="num">{estoque}</td></tr>
          </tbody></table>
        </div>
      )}

      {!!areas.length && (
        <div className="cartao">
          <div className="cabeca"><h2>Produção por área</h2></div>
          <table><thead><tr><th>Área</th><th>Cultura</th><th className="num">Tamanho</th><th className="num">Sacos produzidos</th><th className="num">Sacos/ha</th><th className="num">Custo/saco</th></tr></thead><tbody>
            {areas.map((a: any) => {
              const sacos = producaoArea.get(a.id) ?? 0
              const c = custo.porArea.get(a.id)
              return <tr key={a.id}>
                <td>{a.nome}</td>
                <td><span className="etiqueta">{a.cultura}</span></td>
                <td className="num">{a.tamanho_ha ? `${Number(a.tamanho_ha).toLocaleString('pt-BR')} ha` : '—'}</td>
                <td className="num">{sacos}</td>
                <td className="num">{a.tamanho_ha ? (sacos / Number(a.tamanho_ha)).toFixed(0) : '—'}</td>
                <td className="num">{c !== undefined ? brl(c) : '—'}</td>
              </tr>
            })}
          </tbody></table>
        </div>
      )}

      <div className="cartao">
        <div className="cabeca"><h2>Lançamentos</h2></div>
        {!movimentos.length ? (
          <Vazio titulo="Nenhum lançamento ainda." dica="Produção e uso de sacos aparecem aqui, do mais recente para o mais antigo." />
        ) : (
          <table><thead><tr><th>Data</th><th>Tipo</th><th>Área</th><th>Depósito</th><th>Observações</th><th className="num">Sacos</th><th className="acao"></th></tr></thead><tbody>
            {movimentos.map((m: any) => <tr key={m.id}>
              <td>{dia(m.data)}</td>
              <td><span className={m.tipo === 'uso' ? 'etiqueta alerta' : 'etiqueta'}>{TIPO[m.tipo]}</span></td>
              <td>{m.silagem_areas?.nome ?? '—'}</td>
              <td>{m.silagem_depositos?.nome}</td>
              <td>{m.observacoes ?? '—'}</td>
              <td className="num">{m.tipo === 'uso' ? `−${m.sacos}` : `+${m.sacos}`}</td>
              <td className="acao"><Excluir id={m.id} tabela="silagem_movimentos" revalidar="/silagem" /></td>
            </tr>)}
          </tbody></table>
        )}
      </div>
    </>
  )
}
