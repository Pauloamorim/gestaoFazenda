import { notFound } from 'next/navigation'
import { carregarLote } from '@/lib/dados'
import { brl, dia } from '@/lib/campos'
import { Brinco, Vazio } from '../../../componentes'

type Linha = {
  chave: string
  data: string
  grupo: 'Chegada' | 'Manejo' | 'Custo' | 'Documento'
  tipo: string
  animal?: string | null
  animalId?: string | null
  texto?: string | null
  valor?: number
  peso?: number
  href?: string
}

export default async function Historico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarLote(id)
  if (!dados) notFound()
  const { lote, custos, compras, eventos, documentos } = dados

  // tudo que aconteceu com o lote, numa linha do tempo só
  const linhas: Linha[] = [
    {
      chave: `chegada-${lote.id}`,
      data: lote.data_chegada,
      grupo: 'Chegada' as const,
      tipo: 'Compra do lote',
      texto: `${lote.quantidade} cabeças${lote.observacoes ? ` · ${lote.observacoes}` : ''}`,
      valor: Number(lote.custo_aquisicao) + Number(lote.frete),
    },
    ...eventos.map((e: any) => ({
      chave: e.id,
      data: e.data,
      grupo: 'Manejo' as const,
      tipo: e.tipo,
      animal: e.animais?.identificacao ?? null,
      animalId: e.animal_id as string | null,
      texto: e.descricao,
      peso: e.peso ? Number(e.peso) : undefined,
    })),
    ...custos.map((c: any) => ({
      chave: c.id,
      data: c.data,
      grupo: 'Custo' as const,
      tipo: c.categoria,
      texto: c.descricao,
      valor: Number(c.valor),
    })),
    ...compras.map((c: any) => ({
      chave: `compra-${c.id}`,
      data: c.data,
      grupo: 'Custo' as const,
      tipo: 'Ração / ingrediente',
      texto: `${c.ingredientes?.nome ?? 'Ingrediente'} · ${Number(c.quantidade).toFixed(0)} kg${c.fornecedor ? ` · ${c.fornecedor}` : ''}`,
      valor: Number(c.valor_total),
    })),
    ...documentos.map((d: any) => ({
      chave: d.id,
      data: d.criado_em.slice(0, 10),
      grupo: 'Documento' as const,
      tipo: d.tipo,
      texto: d.nome,
      href: `/documentos/${d.id}`,
    })),
  ].sort((a, b) => (a.data === b.data ? a.grupo.localeCompare(b.grupo) : a.data < b.data ? 1 : -1))

  return (
    <div className="cartao">
      <div className="cabeca">
        <h2>Tudo que aconteceu</h2>
        <p className="sub" style={{ marginTop: -6 }}>
          Chegada, manejo, custos e documentos do lote, do mais recente para o mais antigo.
        </p>
      </div>
      {linhas.length < 2 ? (
        <Vazio
          titulo="Só a chegada do lote por enquanto."
          dica="Conforme você lançar custos, vacinas e pesagens, a linha do tempo se preenche aqui."
        />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Registro</th>
              <th>Animal</th>
              <th>Descrição</th>
              <th className="num">Peso</th>
              <th className="num">Valor</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave}>
                <td>{dia(l.data)}</td>
                <td>
                  <span className={`etiqueta g-${l.grupo.toLowerCase()}`}>{l.tipo}</span>
                </td>
                <td>{l.grupo === 'Manejo' ? <Brinco id={l.animal} href={l.animalId ? `/lotes/${id}/animais/${l.animalId}` : undefined} /> : '—'}</td>
                <td>
                  {l.href ? (
                    <a href={l.href} target="_blank" rel="noopener" className="arquivo">
                      {l.texto}
                    </a>
                  ) : (
                    (l.texto ?? '—')
                  )}
                </td>
                <td className="num">{l.peso ? `${l.peso} kg` : '—'}</td>
                <td className="num">{l.valor === undefined ? '—' : brl(l.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
