import { notFound } from 'next/navigation'
import { carregarEquino, listarEquinos } from '@/lib/dados'
import { dia, hoje } from '@/lib/campos'
import {
  atualizarReproducaoEquina,
  criarReproducaoEquina,
  registrarPartoEquino,
} from '../../../actions'
import { Excluir, Vazio } from '../../../componentes'
import { SeletorGaranhao } from './seletor-garanhao'

const METODOS = ['Monta natural', 'Inseminação artificial', 'Transferência de embrião', 'Outro']
const STATUS = ['Planejada', 'Coberta / inseminada', 'Aguardando diagnóstico', 'Prenhez confirmada', 'Vazia', 'Embrião não recuperado', 'Perda gestacional', 'Cancelada']

export default async function Reproducao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [dados, equinos] = await Promise.all([carregarEquino(id), listarEquinos()])
  if (!dados) notFound()
  const { equino, reproducoes } = dados
  const nomes = new Map(equinos.map((e: any) => [e.id, e.nome]))
  const femeas = equinos.filter((e: any) => e.sexo === 'Fêmea' && ['Ativo', 'Referência'].includes(e.situacao))
  const garanhoes = equinos.filter((e: any) => e.sexo === 'Macho' && ['Ativo', 'Referência'].includes(e.situacao))
  const receptoras = femeas.filter((e: any) => e.funcao_reprodutiva === 'Receptora')
  const ano = Number(hoje().slice(0, 4))

  return (
    <>
      <div className="cartao">
        <div className="cabeca"><h2>Novo ciclo reprodutivo</h2><p className="sub" style={{ marginTop: -6 }}>A matriz é a mãe genética; em transferência de embrião, informe também a receptora.</p></div>
        <div className="corpo">
          {!femeas.length ? (
            <p className="sub">Cadastre pelo menos uma fêmea para iniciar o acompanhamento reprodutivo.</p>
          ) : (
            <form action={criarReproducaoEquina} className="linha">
              <input type="hidden" name="equino_id" value={id} />
              <label>Matriz / doadora<select name="matriz_id" required defaultValue={equino.sexo === 'Fêmea' ? id : ''}><option value="" disabled>Escolha…</option>{femeas.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
              <SeletorGaranhao garanhoes={garanhoes} inicial={equino.sexo === 'Macho' ? id : ''} />
              <label>Receptora<select name="receptora_id" defaultValue=""><option value="">Sem receptora</option>{receptoras.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
              <label>Estação<input name="estacao" required defaultValue={`${ano}/${ano + 1}`} /></label>
              <label>Método<select name="metodo" defaultValue="Monta natural">{METODOS.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Status<select name="status" defaultValue="Planejada">{STATUS.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Cobertura / IA<input name="data_cobertura" type="date" /></label>
              <label>Coleta de embrião<input name="data_coleta" type="date" /></label>
              <label>Transferência<input name="data_transferencia" type="date" /></label>
              <label>Previsão de parto<input name="previsao_parto" type="date" /></label>
              <label className="larga">Observações<input name="observacoes" /></label>
              <button>Registrar ciclo</button>
            </form>
          )}
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Ciclos relacionados a {equino.nome}</h2></div>
        {!reproducoes.length ? (
          <Vazio titulo="Nenhum ciclo reprodutivo." dica="Registre a cobertura, inseminação ou transferência acima." />
        ) : reproducoes.map((r: any) => (
          <div className="ciclo" key={r.id}>
            <div className="ciclo-topo">
              <h3>Estação {r.estacao} — {r.metodo}</h3>
              <span className={['Vazia', 'Embrião não recuperado', 'Perda gestacional', 'Cancelada'].includes(r.status) ? 'etiqueta alerta' : r.status === 'Prenhez confirmada' || r.status === 'Parto realizado' ? 'etiqueta g-custo' : 'etiqueta'}>{r.status}</span>
            </div>
            <dl className="dados">
              <div><dt>Matriz</dt><dd>{nomes.get(r.matriz_id) ?? '—'}</dd></div>
              <div><dt>Garanhão</dt><dd>{(r.garanhao_id ? nomes.get(r.garanhao_id) : r.garanhao_nome) ?? '—'}</dd></div>
              <div><dt>Receptora</dt>{r.receptora_id ? <dd>{nomes.get(r.receptora_id) ?? '—'}</dd> : <dd className="vazio-dado">Sem receptora</dd>}</div>
              <div><dt>{r.data_parto ? 'Parto' : 'Previsão de parto'}</dt>{r.data_parto || r.previsao_parto ? <dd>{dia(r.data_parto ?? r.previsao_parto)}</dd> : <dd className="vazio-dado">Não informada</dd>}</div>
            </dl>
            {r.observacoes && <p className="sub" style={{ marginTop: 12 }}>{r.observacoes}</p>}

            {r.status !== 'Parto realizado' && (
              <form action={atualizarReproducaoEquina} className="linha" style={{ marginTop: 18 }}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="equino_id" value={id} />
                <label>Status<select name="status" defaultValue={r.status}>{STATUS.map((x) => <option key={x}>{x}</option>)}</select></label>
                <label>Previsão de parto<input name="previsao_parto" type="date" defaultValue={r.previsao_parto ?? ''} /></label>
                <label className="larga">Observações<input name="observacoes" defaultValue={r.observacoes ?? ''} /></label>
                <button className="fantasma">Atualizar</button>
              </form>
            )}

            {r.status === 'Prenhez confirmada' && !r.potro_id && (
              <details style={{ marginTop: 14 }}>
                <summary>Registrar parto e criar o produto</summary>
                <form action={registrarPartoEquino} className="linha" style={{ marginTop: 12 }}>
                  <input type="hidden" name="reproducao_id" value={r.id} />
                  <input type="hidden" name="equino_id" value={id} />
                  <label className="larga">Nome do produto<input name="nome" required /></label>
                  <label>Data do parto<input name="data_parto" type="date" required defaultValue={hoje()} /></label>
                  <label>Sexo<select name="sexo" defaultValue="Fêmea"><option>Fêmea</option><option>Macho</option></select></label>
                  <label>Pelagem<input name="pelagem" /></label>
                  <button>Registrar parto</button>
                </form>
              </details>
            )}

            {r.potro_id && <p className="sub" style={{ marginTop: 14 }}>Produto: <a href={`/equinos/${r.potro_id}`}>{nomes.get(r.potro_id) ?? 'abrir ficha'}</a></p>}
            {!r.potro_id && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}><span className="rotulo">Excluir ciclo</span><Excluir id={r.id} tabela="reproducoes_equinas" revalidar={`/equinos/${id}`} /></div>}
          </div>
        ))}
      </div>
    </>
  )
}
