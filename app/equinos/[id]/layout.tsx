import { notFound } from 'next/navigation'
import { carregarEquino } from '@/lib/dados'
import { brl, dia, hoje } from '@/lib/campos'
import { Aba } from '../../nav'

/** "8 anos", "11 meses" — a idade é o que se fala no curral, não a data. */
function idade(nascimento: string) {
  const [a, m] = hoje().split('-').map(Number)
  const [na, nm] = nascimento.split('-').map(Number)
  const meses = (a - na) * 12 + (m - nm)
  if (meses < 12) return `${Math.max(meses, 0)} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

export default async function EquinoLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarEquino(id)
  if (!dados) notFound()
  const { equino, fotos, investido } = dados
  const capa = fotos.find((f: any) => f.principal) ?? fotos[0]
  const detalhes = [
    equino.nascimento && `${idade(equino.nascimento)}, nascido em ${dia(equino.nascimento)}`,
    equino.localizacao,
  ].filter(Boolean)

  return (
    <>
      <div className="cabecalho-equino">
        <div className="retrato">
          {capa ? <img src={`/fotos-equinos/${capa.id}`} alt={capa.legenda || `Foto de ${equino.nome}`} /> : equino.nome.slice(0, 1)}
        </div>
        <div>
          <h1>{equino.nome}</h1>
          {!!detalhes.length && <p className="sub">{detalhes.join(' — ')}</p>}
          <div className="marcas-equino">
            <span className="etiqueta destaque-etiqueta">{equino.funcao_reprodutiva}</span>
            <span className="etiqueta">{equino.sexo}</span>
            <span className="etiqueta">{equino.registro_abccmm ? `ABCCMM ${equino.registro_abccmm}` : 'Sem registro'}</span>
            {equino.andamento !== 'Não avaliado' && <span className="etiqueta">{equino.andamento}</span>}
            {equino.situacao !== 'Ativo' && <span className="etiqueta alerta">{equino.situacao}</span>}
          </div>
        </div>
        <div className="investido-equino">
          <span className="rotulo">Investido</span>
          <strong>{brl(investido)}</strong>
        </div>
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
