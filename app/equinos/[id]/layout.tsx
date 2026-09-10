import { notFound } from 'next/navigation'
import { carregarEquino } from '@/lib/dados'
import { brl, dia } from '@/lib/campos'
import { Aba } from '../../nav'

export default async function EquinoLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarEquino(id)
  if (!dados) notFound()
  const { equino, eventos, reproducoes, investido } = dados
  const ultimoPeso = eventos.find((e: any) => e.peso)
  const prenhezes = reproducoes.filter((r: any) => r.status === 'Prenhez confirmada').length

  return (
    <>
      <h1>{equino.nome}</h1>
      <p className="sub">
        {equino.registro_abccmm ? `ABCCMM ${equino.registro_abccmm}` : 'Sem registro ABCCMM'}
        {equino.nascimento ? ` · Nascido em ${dia(equino.nascimento)}` : ''}
        {equino.localizacao ? ` · ${equino.localizacao}` : ''}
      </p>
      <div className="readout">
        <div><span className="n">{equino.sexo}</span><span className="rotulo">Sexo</span></div>
        <div><span className="n">{equino.funcao_reprodutiva}</span><span className="rotulo">Função</span></div>
        <div><span className="n">{ultimoPeso ? Number(ultimoPeso.peso).toFixed(0) : '—'}</span><span className="rotulo">Último peso (kg)</span></div>
        <div><span className="n">{prenhezes || '—'}</span><span className="rotulo">Prenhezes relacionadas</span></div>
        <div className="destaque"><span className="n">{brl(investido)}</span><span className="rotulo">Investido</span></div>
      </div>
      <div className="abas">
        <Aba href={`/equinos/${id}`}>Resumo</Aba>
        <Aba href={`/equinos/${id}/reproducao`}>Reprodução</Aba>
        <Aba href={`/equinos/${id}/saude`}>Saúde e manejo</Aba>
        <Aba href={`/equinos/${id}/custos`}>Custos</Aba>
        <Aba href={`/equinos/${id}/fotos`}>Fotos</Aba>
        <Aba href={`/equinos/${id}/documentos`}>Documentos</Aba>
        <Aba href={`/equinos/${id}/historico`}>Histórico</Aba>
      </div>
      {children}
    </>
  )
}
