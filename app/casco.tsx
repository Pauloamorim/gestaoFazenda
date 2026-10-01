import Link from 'next/link'
import { db } from '@/lib/supabase'
import { listarEquinos, listarLotes } from '@/lib/dados'
import { cabecasAtivas } from '@/lib/campos'
import { NavItem, NavLote } from './nav'
import { sair } from './actions'

/** Barra lateral + área de conteúdo. Usada por /lotes e /racao. */
export default async function Casco({ children }: { children: React.ReactNode }) {
  const sb = await db()
  // o middleware já validou o JWT nesta requisição; aqui só lemos o e-mail dele
  const [{ data }, lotes, equinos] = await Promise.all([
    sb.auth.getClaims(),
    listarLotes(),
    listarEquinos(),
  ])
  const email = data?.claims?.email as string | undefined

  return (
    <div className="app">
      <nav className="casco">
        <Link href="/lotes" className="marca">
          Gestão Fazenda
        </Link>

        <div className="lotes-nav">
          <p className="rotulo">Lotes</p>
          {lotes.map((l: any) => (
            <NavLote key={l.id} href={`/lotes/${l.id}`} nome={l.nome} cabecas={cabecasAtivas(l.quantidade, l.saidas ?? [])} />
          ))}
          <Link href="/lotes/novo" className="novo-lote">
            + Cadastrar lote
          </Link>

          <p className="rotulo">Equinos</p>
          <NavItem href="/equinos" prefixo>
            Cavalos · {equinos.filter((e: any) => e.situacao === 'Ativo').length}
          </NavItem>
          <Link href="/equinos/novo" className="novo-lote">
            + Cadastrar cavalo
          </Link>
          <Link href="/equinos/custos" className="novo-lote">
            Custos dos equinos
          </Link>

          <p className="rotulo">Ração</p>
          <NavItem href="/racao">Formulações</NavItem>
          <NavItem href="/racao/ingredientes">Ingredientes</NavItem>

          <p className="rotulo">Mercado</p>
          <NavItem href="/cotacoes">Cotações</NavItem>
        </div>

        <div className="casco-pe">
          <strong>{email}</strong>
          <form action={sair}>
            <button>Sair</button>
          </form>
        </div>
      </nav>

      <div className="conteudo">{children}</div>
    </div>
  )
}
