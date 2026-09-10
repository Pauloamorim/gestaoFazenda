import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req })
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  )
  // getClaims valida a assinatura do JWT localmente (chave em cache), sem ida à rede.
  // getUser() faria uma chamada ao Auth a cada clique — ~400ms de atraso por página.
  const { data } = await sb.auth.getClaims()
  const login = req.nextUrl.pathname === '/login'
  if (!data?.claims && !login) return NextResponse.redirect(new URL('/login', req.url))
  if (data?.claims && login) return NextResponse.redirect(new URL('/lotes', req.url))
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
