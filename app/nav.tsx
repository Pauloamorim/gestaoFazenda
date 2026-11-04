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

export function NavItem({ href, children, prefixo = false, conta }: { href: string; children: React.ReactNode; prefixo?: boolean; conta?: number }) {
  const caminho = usePathname()
  const ativo = caminho === href || (prefixo && caminho.startsWith(`${href}/`) && caminho !== '/equinos/novo' && caminho !== '/equinos/custos')
  return (
    <Link href={href} className={ativo ? 'lote-link ativo' : 'lote-link'} {...aoPassar}>
      <span>{children}</span>
      {conta !== undefined && <em>{conta}</em>}
    </Link>
  )
}

export function NavAcao({ href, children }: { href: string; children: React.ReactNode }) {
  const ativo = usePathname() === href
  return (
    <Link href={href} className={ativo ? 'nav-acao ativo' : 'nav-acao'} aria-current={ativo ? 'page' : undefined} {...aoPassar}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
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

/* ---------- celular: abas embaixo (seções) + atalhos da seção no topo ---------- */

const icone = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const SECOES = [
  { nome: 'Gado', base: '/lotes', icone: 'M7 4h10a2 2 0 0 1 2 2v7a7 7 0 0 1-14 0V6a2 2 0 0 1 2-2zM12 8v2', paginas: [['/lotes', 'Rebanho'], ['/lotes/novo', 'Cadastrar lote']] },
  { nome: 'Cavalos', base: '/equinos', icone: 'M6 4v7a6 6 0 0 0 12 0V4M6 8h2M16 8h2', paginas: [['/equinos', 'Plantel'], ['/equinos/novo', 'Cadastrar'], ['/equinos/custos', 'Custos do plantel']] },
  { nome: 'Ração', base: '/racao', icone: 'M4 10h16l-2 10H6L4 10zM8 10V6a4 4 0 0 1 8 0v4', paginas: [['/racao', 'Formulações'], ['/racao/ingredientes', 'Ingredientes']] },
  { nome: 'Silagem', base: '/silagem', icone: 'M4 20h16M6 20v-6h5v6M13 20V9h5v11M8.5 14V4', paginas: [['/silagem', 'Estoque e produção'], ['/silagem/custos', 'Custo do saco'], ['/silagem/cadastros', 'Áreas e depósitos']] },
  { nome: 'Mercado', base: '/cotacoes', icone: 'M4 17l5-5 4 4 7-8M15 8h5v5', paginas: [] },
]

const daSecao = (caminho: string, base: string) => caminho === base || caminho.startsWith(`${base}/`)

export function AbasCelular() {
  const caminho = usePathname()
  return (
    <nav className="abas-celular so-celular" aria-label="Seções">
      {SECOES.map((s) => {
        const ativo = daSecao(caminho, s.base)
        return (
          <Link key={s.base} href={s.base} className={ativo ? 'ativa' : ''} aria-current={ativo ? 'page' : undefined}>
            {icone(s.icone)}
            <span>{s.nome}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function AtalhosCelular() {
  const caminho = usePathname()
  const secao = SECOES.find((s) => daSecao(caminho, s.base))
  if (!secao?.paginas.length) return null
  // página ativa = a de caminho mais longo que bate (ex.: /lotes/abc → Rebanho)
  const ativa = secao.paginas.filter(([h]) => daSecao(caminho, h)).sort((a, b) => b[0].length - a[0].length)[0]?.[0]
  return (
    <div className="atalhos-celular so-celular">
      {secao.paginas.map(([h, nome]) => (
        <Link key={h} href={h} className={h === ativa ? 'ativo' : ''}>{nome}</Link>
      ))}
    </div>
  )
}
