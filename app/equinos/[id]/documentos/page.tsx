import { notFound } from 'next/navigation'
import { carregarEquino } from '@/lib/dados'
import { dia, tamanho } from '@/lib/campos'
import { enviarDocumentoEquino, excluirDocumentoEquino } from '../../../actions'
import { Vazio } from '../../../componentes'

const TIPOS = ['Registro ABCCMM', 'DNA', 'Resenha', 'Exame', 'Atestado sanitário', 'Contrato', 'Nota fiscal', 'Cobertura', 'Transferência de embrião', 'Outro']

export default async function DocumentosEquino({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarEquino(id)
  if (!dados) notFound()
  const { documentos } = dados

  return <>
    <div className="cartao"><div className="cabeca"><h2>Anexar documento</h2><p className="sub" style={{ marginTop: -6 }}>PDF ou foto, até 10 MB, em armazenamento privado.</p></div><div className="corpo"><form action={enviarDocumentoEquino} className="linha">
      <input type="hidden" name="equino_id" value={id} />
      <label>Tipo<input name="tipo" list="tipos-doc-equino" required /></label><datalist id="tipos-doc-equino">{TIPOS.map((x) => <option key={x} value={x} />)}</datalist>
      <label className="larga">Descrição<input name="descricao" /></label><label className="larga">Arquivo<input name="arquivo" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp,image/heic" /></label><button>Anexar</button>
    </form></div></div>
    <div className="cartao"><div className="cabeca"><h2>Arquivos</h2></div>
      {!documentos.length ? <Vazio titulo="Nenhum documento anexado." dica="Guarde registro, DNA, resenha, exames e contratos." /> : <table><thead><tr><th>Tipo</th><th>Arquivo</th><th>Descrição</th><th>Anexado em</th><th className="num">Tamanho</th><th className="acao"></th></tr></thead><tbody>
        {documentos.map((d: any) => <tr key={d.id}><td><span className="etiqueta">{d.tipo}</span></td><td><a href={`/documentos-equinos/${d.id}`} target="_blank" rel="noopener" className="arquivo">{d.nome}</a></td><td>{d.descricao ?? '—'}</td><td>{dia(d.criado_em.slice(0, 10))}</td><td className="num">{tamanho(d.tamanho)}</td><td className="acao"><form action={excluirDocumentoEquino}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="caminho" value={d.caminho} /><input type="hidden" name="equino_id" value={id} /><button className="x" aria-label="Excluir documento">×</button></form></td></tr>)}
      </tbody></table>}
    </div>
  </>
}
