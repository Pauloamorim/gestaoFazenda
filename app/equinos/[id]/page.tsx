import Link from 'next/link'
import { notFound } from 'next/navigation'
import { carregarEquino, listarEquinos } from '@/lib/dados'
import { brl, dia, diasEntre, hoje } from '@/lib/campos'
import { atualizarEquino, excluir } from '../../actions'
import { Vazio } from '../../componentes'

const FUNCOES = ['Garanhão', 'Matriz / doadora', 'Receptora', 'Potro', 'Jovem', 'Castrado']

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

  const avo = (x: any) => x ? <Link href={`/equinos/${x.id}`}>{x.nome}</Link> : '—'
  const genitor = (x: any, nome: string | null) => x ? avo(x) : nome || '—'

  return (
    <>
      <div className="cartao">
        <div className="cabeca"><h2>Identidade e registro</h2></div>
        <div className="corpo identidade-equino">
          {fotoPrincipal && <Link className="foto-capa-equino" href={`/equinos/${id}/fotos`}>
            <img src={`/fotos-equinos/${fotoPrincipal.id}`} alt={fotoPrincipal.legenda || `Foto de ${equino.nome}`} />
          </Link>}
          <div><div className="comparativo">
            <div><span className="rotulo">Registro</span><strong>{equino.status_registro}</strong></div>
            <div><span className="rotulo">DNA</span><strong>{equino.dna_status}</strong></div>
            <div><span className="rotulo">Microchip</span><strong>{equino.microchip ?? '—'}</strong></div>
            <div><span className="rotulo">Pelagem</span><strong>{equino.pelagem ?? '—'}</strong></div>
            <div><span className="rotulo">Andamento</span><strong>{equino.andamento}</strong></div>
            <div><span className="rotulo">Situação</span><strong>{equino.situacao}</strong></div>
          </div>
          {equino.observacoes && <p className="sub" style={{ marginTop: 14 }}>{equino.observacoes}</p>}
          {!fotoPrincipal && <p className="sub" style={{ marginTop: 14 }}><Link href={`/equinos/${id}/fotos`}>Adicionar foto do equino</Link></p>}
          </div>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Pedigree · três gerações</h2></div>
        {!pai && !mae && !equino.pai_nome && !equino.mae_nome ? (
          <Vazio titulo="Genealogia não informada." dica="Cadastre os ancestrais como animais de referência e selecione pai e mãe abaixo." />
        ) : (
          <table>
            <thead><tr><th>Animal</th><th>Genitor</th><th>Avô</th><th>Avó</th></tr></thead>
            <tbody>
              <tr><td rowSpan={2}><strong>{equino.nome}</strong></td><td><span className="etiqueta">Pai</span> {genitor(pai, equino.pai_nome)}</td><td>{avo(porId.get(pai?.pai_id))}</td><td>{avo(porId.get(pai?.mae_id))}</td></tr>
              <tr><td><span className="etiqueta">Mãe</span> {genitor(mae, equino.mae_nome)}</td><td>{avo(porId.get(mae?.pai_id))}</td><td>{avo(porId.get(mae?.mae_id))}</td></tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Próximos cuidados</h2></div>
        {!pendencias.length ? (
          <Vazio titulo="Nenhum cuidado agendado." dica="Em Saúde e manejo, informe a próxima data de vacina, ferrageamento ou exame." />
        ) : (
          <table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th className="num">Em</th></tr></thead><tbody>
            {pendencias.map((e: any) => <tr key={e.id}><td>{dia(e.proxima_data)}</td><td>{e.tipo}</td><td>{e.descricao ?? '—'}</td><td className="num">{diasEntre(hoje(), e.proxima_data)} dias</td></tr>)}
          </tbody></table>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Financeiro</h2></div>
        <div className="corpo"><div className="comparativo">
          <div><span className="rotulo">Aquisição</span><strong>{brl(Number(equino.valor_aquisicao))}</strong></div>
          <div><span className="rotulo">Custos lançados</span><strong>{brl(investido - Number(equino.valor_aquisicao))}</strong></div>
          <div><span className="rotulo">Custo médio</span><strong>{custos.length ? brl(custoMedio) : '—'}</strong></div>
          <div><span className="rotulo">Total investido</span><strong>{brl(investido)}</strong></div>
        </div></div>
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Editar cadastro</h2></div>
        <div className="corpo">
          <form action={atualizarEquino} className="linha">
            <input type="hidden" name="id" value={id} />
            <label className="larga">Nome<input name="nome" required defaultValue={equino.nome} /></label>
            <label>Função<select name="funcao_reprodutiva" defaultValue={equino.funcao_reprodutiva}>{FUNCOES.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label>Nascimento<input name="nascimento" type="date" defaultValue={equino.nascimento ?? ''} /></label>
            <label>Registro ABCCMM<input name="registro_abccmm" defaultValue={equino.registro_abccmm ?? ''} /></label>
            <label>Status do registro<select name="status_registro" defaultValue={equino.status_registro}><option>Sem registro</option><option>Provisório</option><option>Definitivo</option></select></label>
            <label>Microchip<input name="microchip" defaultValue={equino.microchip ?? ''} /></label>
            <label>DNA<select name="dna_status" defaultValue={equino.dna_status}><option>Não realizado</option><option>Coletado</option><option>Em análise</option><option>Compatível</option><option>Incompatível</option></select></label>
            <label>Pelagem<input name="pelagem" defaultValue={equino.pelagem ?? ''} /></label>
            <label>Andamento<select name="andamento" defaultValue={equino.andamento}><option>Não avaliado</option><option>Marcha batida</option><option>Marcha picada</option></select></label>
            <label>Pai cadastrado<select name="pai_id" defaultValue={equino.pai_id ?? ''}><option value="">Não vincular</option>{machos.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
            <label>Ou apenas o nome do pai<input name="pai_nome" defaultValue={equino.pai_nome ?? ''} placeholder="Nome e sufixo do garanhão" /></label>
            <label>Mãe cadastrada<select name="mae_id" defaultValue={equino.mae_id ?? ''}><option value="">Não vincular</option>{femeas.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
            <label>Ou apenas o nome da mãe<input name="mae_nome" defaultValue={equino.mae_nome ?? ''} placeholder="Nome e sufixo da matriz" /></label>
            <label>Criador<input name="criador" defaultValue={equino.criador ?? ''} /></label>
            <label>Proprietário<input name="proprietario" defaultValue={equino.proprietario ?? ''} /></label>
            <label>Localização<input name="localizacao" defaultValue={equino.localizacao ?? ''} /></label>
            <label>Situação<select name="situacao" defaultValue={equino.situacao}><option>Ativo</option><option>Referência</option><option>Vendido</option><option>Transferido</option><option>Falecido</option></select></label>
            <label>Data de aquisição<input name="data_aquisicao" type="date" defaultValue={equino.data_aquisicao ?? ''} /></label>
            <label>Valor de aquisição<input name="valor_aquisicao" type="number" min="0" step="0.01" defaultValue={Number(equino.valor_aquisicao)} /></label>
            <label className="larga">Observações<textarea name="observacoes" rows={3} defaultValue={equino.observacoes ?? ''} /></label>
            <button>Salvar cadastro</button>
          </form>
        </div>
      </div>

      <div className="cartao"><div className="corpo"><details className="perigo-zona"><summary>Excluir este equino</summary><p className="aviso">Registros reprodutivos podem impedir a exclusão para preservar a genealogia.</p><form action={excluir}><input type="hidden" name="tabela" value="equinos" /><input type="hidden" name="id" value={id} /><input type="hidden" name="ir" value="/equinos" /><button className="perigo">Excluir {equino.nome}</button></form></details></div></div>
    </>
  )
}
