import Link from 'next/link'
import { notFound } from 'next/navigation'
import { carregarEquino, listarEquinos } from '@/lib/dados'
import { brl, dia, diasEntre, hoje } from '@/lib/campos'
import { atualizarEquino, excluir } from '../../actions'
import { Vazio } from '../../componentes'
import { CamposEquino } from '../campos'


export default async function ResumoEquino({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [dados, equinos] = await Promise.all([carregarEquino(id), listarEquinos()])
  if (!dados) notFound()
  const { equino, pai, mae, avos, eventos, custos, fotos, investido } = dados
  const fotoPrincipal = fotos.find((foto: any) => foto.principal) ?? fotos[0]
  const porId = new Map(avos.map((e: any) => [e.id, e]))
  const machos = equinos.filter((e: any) => e.sexo === 'Macho' && e.id !== id)
  const femeas = equinos.filter((e: any) => e.sexo === 'Fêmea' && e.id !== id)
  const pendencias = eventos
    .filter((e: any) => e.proxima_data && e.proxima_data >= hoje())
    .sort((a: any, b: any) => (a.proxima_data < b.proxima_data ? -1 : 1))
    .slice(0, 5)
  const custoMedio = custos.length ? custos.reduce((s: number, c: any) => s + Number(c.valor), 0) / custos.length : 0

  const ultimoPeso = eventos.find((e: any) => e.peso)
  const dado = (rotulo: string, valor: React.ReactNode) => (
    <div><dt>{rotulo}</dt>{valor ? <dd>{valor}</dd> : <dd className="vazio-dado">Não informado</dd>}</div>
  )
  const no = (classe: string, papel: string, x: any, nomeLivre?: string | null) => (
    <div className={`no ${classe}${x || nomeLivre ? '' : ' desconhecido'}`}>
      <small>{papel}</small>
      <b>{x ? <Link href={`/equinos/${x.id}`}>{x.nome}</Link> : nomeLivre || 'Não informado'}</b>
    </div>
  )

  return (
    <>
      <div className="duas-colunas">
        <div className="cartao">
          <div className="cabeca"><h2>Ficha</h2></div>
          <div className="corpo">
            <dl className="dados">
              {dado('Registro', equino.status_registro)}
              {dado('DNA', equino.dna_status)}
              {dado('Microchip', equino.microchip)}
              {dado('Pelagem', equino.pelagem)}
              {dado('Andamento', equino.andamento !== 'Não avaliado' && equino.andamento)}
              {dado('Último peso', ultimoPeso && `${Number(ultimoPeso.peso).toFixed(0)} kg em ${dia(ultimoPeso.data)}`)}
              {dado('Criador', equino.criador)}
              {dado('Proprietário', equino.proprietario)}
            </dl>
            {equino.observacoes && <p className="sub" style={{ marginTop: 18 }}>{equino.observacoes}</p>}
            {!fotoPrincipal && <p className="sub" style={{ marginTop: 18 }}><Link href={`/equinos/${id}/fotos`}>Adicionar uma foto</Link></p>}
          </div>
        </div>

        <div className="cartao">
          <div className="cabeca"><h2>Próximos cuidados</h2></div>
          {!pendencias.length ? (
            <Vazio titulo="Nada agendado." dica={<>Em <Link href={`/equinos/${id}/saude`}>Saúde e manejo</Link>, informe a próxima vacina, ferrageamento ou exame.</>} />
          ) : (
            <table><tbody>
              {pendencias.map((e: any) => <tr key={e.id}>
                <td><strong>{e.tipo}</strong><br /><span className="rotulo">{e.descricao ?? dia(e.proxima_data)}</span></td>
                <td className="num">{dia(e.proxima_data)}<br /><span className="rotulo">em {diasEntre(hoje(), e.proxima_data)} dias</span></td>
              </tr>)}
            </tbody></table>
          )}
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Pedigree</h2></div>
        <div className="pedigree">
          <div className="no raiz"><small>{equino.sexo === 'Fêmea' ? 'Égua' : 'Cavalo'}</small><b>{equino.nome}</b></div>
          {no('pai', 'Pai', pai, equino.pai_nome)}
          {no('mae', 'Mãe', mae, equino.mae_nome)}
          {no('avo', 'Avô paterno', porId.get(pai?.pai_id))}
          {no('avo', 'Avó paterna', porId.get(pai?.mae_id))}
          {no('avo', 'Avô materno', porId.get(mae?.pai_id))}
          {no('avo', 'Avó materna', porId.get(mae?.mae_id))}
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Financeiro</h2></div>
        <div className="corpo">
          <dl className="dados">
            {dado('Aquisição', `${brl(Number(equino.valor_aquisicao))}${equino.data_aquisicao ? ` em ${dia(equino.data_aquisicao)}` : ''}`)}
            {dado('Custos lançados', `${brl(investido - Number(equino.valor_aquisicao))} em ${custos.length} lançamento${custos.length === 1 ? '' : 's'}`)}
            {dado('Custo médio por lançamento', custos.length && brl(custoMedio))}
            {dado('Total investido', brl(investido))}
          </dl>
        </div>
      </div>

      <div className="cartao">
        <div className="corpo" style={{ paddingTop: 18 }}><details>
          <summary>Editar cadastro</summary>
          <form action={atualizarEquino} className="linha">
            <input type="hidden" name="id" value={id} />
            <CamposEquino e={equino} machos={machos} femeas={femeas} />
            <button>Salvar cadastro</button>
          </form>
        </details></div>
      </div>

      <div className="cartao"><div className="corpo" style={{ paddingTop: 18 }}><details className="perigo-zona"><summary>Excluir este equino</summary><p className="aviso">Registros reprodutivos podem impedir a exclusão para preservar a genealogia.</p><form action={excluir}><input type="hidden" name="tabela" value="equinos" /><input type="hidden" name="id" value={id} /><input type="hidden" name="ir" value="/equinos" /><button className="perigo">Excluir {equino.nome}</button></form></details></div></div>
    </>
  )
}
