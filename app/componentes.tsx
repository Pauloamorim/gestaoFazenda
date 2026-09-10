import Link from 'next/link'
import { excluir } from './actions'

export function Brinco({ id, href }: { id: string | null | undefined; href?: string }) {
  if (!id) return <span className="brinco lote">Lote inteiro</span>
  return href ? (
    <Link href={href} className="brinco">
      {id}
    </Link>
  ) : (
    <span className="brinco">{id}</span>
  )
}

export function Excluir({
  id,
  tabela,
  revalidar,
  ir,
}: {
  id: string
  tabela: string
  revalidar: string
  ir?: string
}) {
  return (
    <form action={excluir}>
      <input type="hidden" name="tabela" value={tabela} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="revalidar" value={revalidar} />
      {ir && <input type="hidden" name="ir" value={ir} />}
      <button className="x" title="Excluir" aria-label="Excluir">
        ×
      </button>
    </form>
  )
}

export function Vazio({ titulo, dica }: { titulo: string; dica: string }) {
  return (
    <p className="vazio">
      <strong>{titulo}</strong>
      {dica}
    </p>
  )
}
