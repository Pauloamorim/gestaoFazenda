import Link from 'next/link'
import { notFound } from 'next/navigation'
import { listarAreasSilagem, listarDepositosSilagem, listarMovimentosSilagem } from '@/lib/dados'
import { atualizarMovimentoSilagem } from '../../../actions'

const TITULO = { producao: 'Editar produção', uso: 'Editar uso', saldo_inicial: 'Editar saldo inicial' } as Record<string, string>

export default async function EditarLancamento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [movimentos, areas, depositos] = await Promise.all([
    listarMovimentosSilagem(),
    listarAreasSilagem(),
    listarDepositosSilagem(),
  ])
  const m = movimentos.find((x: any) => x.id === id)
  if (!m) notFound()

  return (
    <>
      <h1>{TITULO[m.tipo]}</h1>
      <p className="sub"><Link href="/silagem">← Voltar para a silagem</Link></p>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="corpo">
          <form action={atualizarMovimentoSilagem} className="linha">
            <input type="hidden" name="id" value={m.id} />
            <label>Data<input name="data" type="date" required defaultValue={m.data} /></label>
            {m.tipo === 'producao' && (
              <label>Área<select name="area_id" required defaultValue={m.area_id}>{areas.map((a: any) => <option key={a.id} value={a.id}>{a.nome} · {a.cultura}</option>)}</select></label>
            )}
            <label>Depósito<select name="deposito_id" required defaultValue={m.deposito_id}>{depositos.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></label>
            <label>Sacos<input name="sacos" type="number" min="1" step="1" required defaultValue={m.sacos} /></label>
            <label className="larga">Observações<input name="observacoes" defaultValue={m.observacoes ?? ''} /></label>
            <button>Salvar</button>
          </form>
        </div>
      </div>
    </>
  )
}
