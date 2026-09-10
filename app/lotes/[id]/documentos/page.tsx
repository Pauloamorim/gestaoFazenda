import { notFound } from 'next/navigation'
import { carregarLote } from '@/lib/dados'
import { dia, tamanho } from '@/lib/campos'
import { enviarDocumento, excluirDocumento } from '../../../actions'
import { Vazio } from '../../../componentes'

const TIPOS = ['GTA', 'Nota fiscal', 'Contrato', 'Receituário', 'Exame', 'Certificado', 'Outro']

export default async function Documentos({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarLote(id)
  if (!dados) notFound()
  const { documentos } = dados

  return (
    <>
      <div className="cartao">
        <div className="cabeca">
          <h2>Anexar documento</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            PDF ou foto, até 10 MB. Fica guardado só para você — os links expiram em 1 minuto.
          </p>
        </div>
        <div className="corpo">
          <form action={enviarDocumento} className="linha">
            <input type="hidden" name="lote_id" value={id} />
            <label>
              Tipo
              <input name="tipo" list="tipos-doc" required defaultValue="GTA" />
            </label>
            <datalist id="tipos-doc">
              {TIPOS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <label className="larga">
              Descrição
              <input name="descricao" placeholder="GTA 4471 — saída da Fazenda São Jorge" />
            </label>
            <label className="larga">
              Arquivo
              <input
                name="arquivo"
                type="file"
                required
                accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
              />
            </label>
            <button>Anexar</button>
          </form>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>
            Arquivos <span className="etiqueta">{documentos.length}</span>
          </h2>
        </div>
        {!documentos.length ? (
          <Vazio
            titulo="Nenhum documento anexado."
            dica="Guarde aqui a GTA, a nota fiscal da compra e o que mais precisar comprovar depois."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Arquivo</th>
                <th>Descrição</th>
                <th>Anexado em</th>
                <th className="num">Tamanho</th>
                <th className="acao"></th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((d: any) => (
                <tr key={d.id}>
                  <td>
                    <span className="etiqueta">{d.tipo}</span>
                  </td>
                  <td>
                    <a
                      href={`/documentos/${d.id}`}
                      target="_blank"
                      rel="noopener"
                      className="arquivo"
                      title="Abrir em nova aba"
                    >
                      {d.nome}
                    </a>
                  </td>
                  <td>{d.descricao ?? '—'}</td>
                  <td>{dia(d.criado_em.slice(0, 10))}</td>
                  <td className="num">{tamanho(d.tamanho)}</td>
                  <td className="acao">
                    <form action={excluirDocumento}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="caminho" value={d.caminho} />
                      <input type="hidden" name="lote_id" value={id} />
                      <button className="x" title="Excluir" aria-label="Excluir documento">
                        ×
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
