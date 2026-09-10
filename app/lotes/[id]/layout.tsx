import { notFound } from 'next/navigation'
import { carregarLote } from '@/lib/dados'
import { brl, dia } from '@/lib/campos'
import { Aba } from '../../nav'

export default async function LoteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const dados = await carregarLote(id)
  if (!dados) notFound()
  const { lote, ativos, investido, pesoMedio, gmdLote, cabecas } = dados

  return (
    <>
      <h1>{lote.nome}</h1>
      <p className="sub">
        Chegou em {dia(lote.data_chegada)}
        {lote.observacoes ? ` · ${lote.observacoes}` : ''}
      </p>

      <div className="readout">
        <div>
          <span className="n">{cabecas}</span>
          <span className="rotulo">
            Cabeças{cabecas < lote.quantidade ? ` · ${lote.quantidade - cabecas} saíram` : ''}
          </span>
        </div>
        <div>
          <span className="n">{ativos.length}</span>
          <span className="rotulo">Com brinco</span>
        </div>
        <div>
          <span className="n">{pesoMedio ? pesoMedio.toFixed(0) : '—'}</span>
          <span className="rotulo">Peso médio (kg)</span>
        </div>
        <div>
          <span className="n">{gmdLote ? gmdLote.toFixed(2).replace('.', ',') : '—'}</span>
          <span className="rotulo">Ganho/dia (kg)</span>
        </div>
        <div>
          <span className="n">{brl(investido)}</span>
          <span className="rotulo">Investido</span>
        </div>
        <div className="destaque">
          <span className="n">{cabecas ? brl(investido / cabecas) : '—'}</span>
          <span className="rotulo">Custo por cabeça</span>
        </div>
      </div>

      <div className="abas">
        <Aba href={`/lotes/${id}`}>Resumo</Aba>
        <Aba href={`/lotes/${id}/animais`}>Animais</Aba>
        <Aba href={`/lotes/${id}/custos`}>Custos</Aba>
        <Aba href={`/lotes/${id}/sanidade`}>Sanidade e peso</Aba>
        <Aba href={`/lotes/${id}/documentos`}>Documentos</Aba>
        <Aba href={`/lotes/${id}/saidas`}>Saídas e venda</Aba>
        <Aba href={`/lotes/${id}/historico`}>Histórico</Aba>
      </div>

      {children}
    </>
  )
}
