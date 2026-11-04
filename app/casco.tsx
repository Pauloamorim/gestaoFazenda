import Link from 'next/link'
import { db } from '@/lib/supabase'
import { listarEquinos, listarLotes } from '@/lib/dados'
import { cabecasAtivas } from '@/lib/campos'
import { AbasCelular, AtalhosCelular, NavAcao, NavItem, NavLote } from './nav'
import { sair } from './actions'

/** Barra lateral + área de conteúdo, usada por todas as telas internas. */
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
          <p className="rotulo">Gado</p>
          {lotes.map((l: any) => (
            <NavLote key={l.id} href={`/lotes/${l.id}`} nome={l.nome} cabecas={cabecasAtivas(l.quantidade, l.saidas ?? [])} />
          ))}
          <NavAcao href="/lotes/novo">Cadastrar lote</NavAcao>

          <p className="rotulo">Cavalos</p>
          <NavItem href="/equinos" prefixo conta={equinos.filter((e: any) => e.situacao === 'Ativo').length}>
            Plantel
          </NavItem>
          <NavItem href="/equinos/custos">Custos do plantel</NavItem>

          <p className="rotulo">Ração</p>
          <NavItem href="/racao">Formulações</NavItem>
          <NavItem href="/racao/ingredientes">Ingredientes</NavItem>

          <p className="rotulo">Silagem</p>
          <NavItem href="/silagem">Estoque e produção</NavItem>
          <NavItem href="/silagem/custos">Custo do saco</NavItem>
          <NavItem href="/silagem/cadastros">Áreas e depósitos</NavItem>

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

      <header className="topo-celular so-celular">
        <Link href="/lotes" className="marca">Gestão Fazenda</Link>
        <form action={sair}>
          <button title={email}>Sair</button>
        </form>
      </header>

      <div className="conteudo">
        <AtalhosCelular />
        {children}
      </div>
      <AbasCelular />
    </div>
  )
}
