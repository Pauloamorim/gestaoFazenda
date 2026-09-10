import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const KEY_SB = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export async function db() {
  const store = await cookies()
  return createServerClient(URL_SB, KEY_SB, {
    cookies: {
      getAll: () => store.getAll(),
      // ponytail: Server Components não podem gravar cookie; o middleware renova a sessão
      setAll: (cs) => {
        try {
          cs.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {}
      },
    },
  })
}

/** Desempacota resposta do Supabase, virando erro visível na tela. */
export function ok<T>({ data, error }: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (error) throw new Error(error.message)
  return data as NonNullable<T>
}
