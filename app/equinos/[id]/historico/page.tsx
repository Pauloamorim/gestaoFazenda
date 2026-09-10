import { notFound } from 'next/navigation'
import { carregarEquino, listarEquinos } from '@/lib/dados'
import { brl, dia } from '@/lib/campos'
import { Vazio } from '../../../componentes'

type Linha = { chave: string; data: string; grupo: string; tipo: string; texto?: string | null; valor?: number; href?: string }

export default async function HistoricoEquino({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [dados, equinos] = await Promise.all([carregarEquino(id), listarEquinos()])
  if (!dados) notFound()
  const { equino, eventos, custos, documentos, fotos, reproducoes } = dados
  const nomes = new Map(equinos.map((e: any) => [e.id, e.nome]))
  const linhas: Linha[] = [
    { chave: `cadastro-${id}`, data: equino.data_aquisicao ?? equino.criado_em.slice(0, 10), grupo: 'Cadastro', tipo: equino.data_aquisicao ? 'Aquisição' : 'Cadastro', texto: equino.observacoes, valor: equino.data_aquisicao ? Number(equino.valor_aquisicao) : undefined },
    ...eventos.map((e: any) => ({ chave: `evento-${e.id}`, data: e.data, grupo: 'Manejo', tipo: e.tipo, texto: e.descricao })),
    ...custos.map((c: any) => ({ chave: `custo-${c.id}`, data: c.data, grupo: 'Custo', tipo: c.categoria, texto: c.descricao, valor: Number(c.valor) })),
    ...documentos.map((d: any) => ({ chave: `doc-${d.id}`, data: d.criado_em.slice(0, 10), grupo: 'Documento', tipo: d.tipo, texto: d.nome, href: `/documentos-equinos/${d.id}` })),
    ...fotos.map((f: any) => ({ chave: `foto-${f.id}`, data: f.criado_em.slice(0, 10), grupo: 'Foto', tipo: f.principal ? 'Foto de capa' : 'Foto adicionada', texto: f.legenda ?? f.nome, href: `/fotos-equinos/${f.id}` })),
    ...reproducoes.map((r: any) => ({ chave: `repro-${r.id}`, data: r.data_parto ?? r.data_transferencia ?? r.data_cobertura ?? r.criado_em.slice(0, 10), grupo: 'Reprodução', tipo: r.status, texto: `${r.estacao} · ${nomes.get(r.matriz_id) ?? '—'} × ${(r.garanhao_id ? nomes.get(r.garanhao_id) : r.garanhao_nome) ?? '—'}${r.receptora_id ? ` · receptora ${nomes.get(r.receptora_id) ?? '—'}` : ''}` })),
  ].sort((a, b) => (a.data < b.data ? 1 : -1))

  return <div className="cartao"><div className="cabeca"><h2>Histórico completo</h2><p className="sub" style={{ marginTop: -6 }}>Cadastro, reprodução, saúde, custos e documentos em uma linha do tempo.</p></div>
    {!linhas.length ? <Vazio titulo="Histórico vazio." dica="Os registros do animal aparecem aqui." /> : <table><thead><tr><th>Data</th><th>Grupo</th><th>Registro</th><th>Descrição</th><th className="num">Valor</th></tr></thead><tbody>
      {linhas.map((l) => <tr key={l.chave}><td>{dia(l.data)}</td><td><span className="etiqueta">{l.grupo}</span></td><td>{l.tipo}</td><td>{l.href ? <a href={l.href} target="_blank" rel="noopener" className="arquivo">{l.texto}</a> : l.texto ?? '—'}</td><td className="num">{l.valor === undefined ? '—' : brl(l.valor)}</td></tr>)}
    </tbody></table>}
  </div>
}
