import { notFound } from 'next/navigation'
import { carregarEquino } from '@/lib/dados'
import { definirFotoPrincipal, enviarFotoEquino, excluirFotoEquino } from '../../../actions'
import { Vazio } from '../../../componentes'

export default async function FotosEquino({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarEquino(id)
  if (!dados) notFound()
  const { fotos } = dados

  return <>
    <div className="cartao">
      <div className="cabeca"><h2>Adicionar foto</h2><p className="sub" style={{ marginTop: -6 }}>JPG, PNG ou WebP, até 10 MB. As fotos são privadas.</p></div>
      <div className="corpo"><form action={enviarFotoEquino} className="linha">
        <input type="hidden" name="equino_id" value={id} />
        <label className="larga">Foto<input name="arquivo" type="file" required accept="image/jpeg,image/png,image/webp" /></label>
        <label className="larga">Legenda<input name="legenda" placeholder="Ex.: Exposição de 2026" /></label>
        <button>Adicionar foto</button>
      </form></div>
    </div>

    <div className="cartao">
      <div className="cabeca"><h2>Galeria</h2></div>
      {!fotos.length ? <Vazio titulo="Nenhuma foto adicionada." dica="A primeira foto será usada como capa do equino." /> : (
        <div className="galeria-equino">
          {fotos.map((foto: any) => <article className="foto-equino" key={foto.id}>
            <a href={`/fotos-equinos/${foto.id}`} target="_blank" rel="noopener">
              <img src={`/fotos-equinos/${foto.id}`} alt={foto.legenda || `Foto do equino ${dados.equino.nome}`} loading="lazy" />
            </a>
            <div className="foto-equino-info">
              <p>{foto.legenda || foto.nome}</p>
              <div className="foto-equino-acoes">
                {foto.principal ? <span className="etiqueta">Foto de capa</span> : <form action={definirFotoPrincipal}><input type="hidden" name="id" value={foto.id} /><input type="hidden" name="equino_id" value={id} /><button className="fantasma">Usar como capa</button></form>}
                <form action={excluirFotoEquino}><input type="hidden" name="id" value={foto.id} /><input type="hidden" name="equino_id" value={id} /><button className="x" aria-label="Excluir foto">×</button></form>
              </div>
            </div>
          </article>)}
        </div>
      )}
    </div>
  </>
}
