import { NextResponse } from 'next/server'
import { db, ok } from '@/lib/supabase'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = await db()
  const foto = ok(await sb.from('fotos_equinos').select('caminho').eq('id', id).maybeSingle())
  if (!foto) return new NextResponse('Foto não encontrada.', { status: 404 })
  const { signedUrl } = ok(await sb.storage.from('documentos').createSignedUrl(foto.caminho, 60))
  return NextResponse.redirect(signedUrl)
}
