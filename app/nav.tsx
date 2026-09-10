'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Passar o mouse já busca a página inteira; o clique só troca a tela.
 *  Sem isso o Next só pré-busca o esqueleto e a consulta ao banco fica no clique. */
const aoPassar = { prefetch: true as const, unstable_dynamicOnHover: true }

export function NavLote({ href, nome, cabecas }: { href: string; nome: string; cabecas: number }) {
  const ativo = usePathname().startsWith(href)
  return (
    <Link href={href} className={ativo ? 'lote-link ativo' : 'lote-link'} {...aoPassar}>
      <span>{nome}</span>
      <em>{cabecas}</em>
    </Link>
  )
}

export function Aba({ href, children }: { href: string; children: React.ReactNode }) {
  const ativo = usePathname() === href
  return (
    <Link href={href} className={ativo ? 'aba ativa' : 'aba'} {...aoPassar}>
      {children}
    </Link>
  )
}

export function NavItem({ href, children, prefixo = false }: { href: string; children: React.ReactNode; prefixo?: boolean }) {
  const caminho = usePathname()
  const ativo = caminho === href || (prefixo && caminho.startsWith(`${href}/`))
  return (
    <Link href={href} className={ativo ? 'lote-link ativo' : 'lote-link'} {...aoPassar}>
      <span>{children}</span>
    </Link>
  )
}

/** Link de tabela (nome do lote, nome da mistura). */
export function LinkTabela({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontWeight: 600 }} {...aoPassar}>
      {children}
    </Link>
  )
}
