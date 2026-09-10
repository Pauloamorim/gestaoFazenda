import { NextResponse } from 'next/server'
import { db, ok } from '@/lib/supabase'

/** Gera um link assinado na hora do clique — o bucket é privado e os links
 *  expiram em 1 minuto, então nada fica exposto se alguém copiar a URL. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = await db()
  const doc = ok(await sb.from('documentos').select('caminho').eq('id', id).maybeSingle())
  if (!doc) return new NextResponse('Documento não encontrado.', { status: 404 })

  const { signedUrl } = ok(await sb.storage.from('documentos').createSignedUrl(doc.caminho, 60))
  return NextResponse.redirect(signedUrl)
}
