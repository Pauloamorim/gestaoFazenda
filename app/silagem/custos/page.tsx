import { brl } from '@/lib/campos'
import { listarInsumosSilagem } from '@/lib/dados'
import { custoDoSaco, custoNoSaco } from '@/lib/silagem'
import { atualizarInsumoSilagem, criarInsumoSilagem } from '../../actions'
import { Excluir, Vazio } from '../../componentes'

const n = (v: number | string) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 3 })

function CamposInsumo({ i }: { i?: any }) {
  return (
    <>
      <label>Insumo<input name="nome" required defaultValue={i?.nome} placeholder="Milho" /></label>
      <label>Unidade<input name="unidade" required defaultValue={i?.unidade} placeholder="kg, un, m" /></label>
      <label>Qtd. comprada<input name="qtd_comprada" type="number" min="0.001" step="0.001" required defaultValue={i?.qtd_comprada} placeholder="60" /></label>
      <label>Valor pago (R$)<input name="valor_pago" type="number" min="0" step="0.01" required defaultValue={i?.valor_pago} placeholder="90,00" /></label>
      <label>Qtd. por saco<input name="qtd_por_saco" type="number" min="0.001" step="0.001" required defaultValue={i?.qtd_por_saco} placeholder="2" /></label>
    </>
  )
}

export default async function CustoDoSaco() {
  const insumos = await listarInsumosSilagem()
  const total = custoDoSaco(insumos)

  return (
    <>
      <h1>Custo do saco</h1>
      <p className="sub">
        Tudo o que vai em um saco de silagem: milho, o saco, o amarrilho. Informe o que pagou, quanto veio
        e quanto vai em cada saco. Mudou o preço, é só editar.
      </p>

      <div className="readout">
        <div className="destaque"><span className="n">{insumos.length ? brl(total) : '—'}</span><span className="rotulo">Custo por saco</span></div>
        <div><span className="n">{insumos.length}</span><span className="rotulo">Insumos</span></div>
      </div>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca"><h2>Adicionar insumo</h2></div>
        <div className="corpo">
          <form action={criarInsumoSilagem} className="linha">
            <CamposInsumo />
            <button>Adicionar</button>
          </form>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Composição de um saco</h2></div>
        {!insumos.length ? (
          <Vazio titulo="Nenhum insumo ainda." dica="Adicione milho, saco, amarrilho e o que mais entra em cada saco." />
        ) : (
          <table><thead><tr><th>Insumo</th><th className="num">Preço pago</th><th className="num">Por saco</th><th className="num">Custo no saco</th><th className="num">%</th></tr></thead><tbody>
            {insumos.map((i: any) => {
              const c = custoNoSaco(i)
              return <tr key={i.id}>
                <td>{i.nome}</td>
                <td className="num">{brl(Number(i.valor_pago) / Number(i.qtd_comprada))}/{i.unidade}</td>
                <td className="num">{n(i.qtd_por_saco)} {i.unidade}</td>
                <td className="num">{brl(c)}</td>
                <td className="num">{total ? ((c / total) * 100).toFixed(0) : 0}%</td>
              </tr>
            })}
            <tr className="total"><td colSpan={3}>Custo por saco</td><td className="num">{brl(total)}</td><td></td></tr>
          </tbody></table>
        )}
      </div>

      {!!insumos.length && (
        <div className="cartao">
          <div className="cabeca"><h2>Editar preços e quantidades</h2></div>
          <div className="corpo">
            {insumos.map((i: any) => (
              <div key={i.id} style={{ display: 'flex', gap: 12, alignItems: 'end', marginTop: 12 }}>
                <form action={atualizarInsumoSilagem} className="linha" style={{ flex: 1 }}>
                  <input type="hidden" name="id" value={i.id} />
                  <CamposInsumo i={i} />
                  <button>Salvar</button>
                </form>
                <Excluir id={i.id} tabela="silagem_insumos" revalidar="/silagem" />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
