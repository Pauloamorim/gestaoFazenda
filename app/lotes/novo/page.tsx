import { criarLote } from '../../actions'
import { hoje } from '@/lib/campos'

export default function NovoLote() {
  return (
    <>
      <h1>Cadastrar lote</h1>
      <p className="sub">Os dados da compra. Custos do dia a dia você lança depois, dentro do lote.</p>

      <div className="cartao" style={{ maxWidth: 720, marginTop: 22 }}>
        <div className="corpo" style={{ paddingTop: 18 }}>
          <form action={criarLote} className="linha">
            <label className="larga">
              Nome do lote
              <input name="nome" required placeholder="Nelore — Fazenda Boa Vista" autoFocus />
            </label>
            <label>
              Cabeças
              <input name="quantidade" type="number" min="1" step="1" required />
            </label>
            <label>
              Chegada
              <input name="data_chegada" type="date" required defaultValue={hoje()} />
            </label>
            <label>
              Custo de aquisição (R$)
              <input name="custo_aquisicao" type="number" min="0" step="0.01" required />
            </label>
            <label>
              Frete (R$)
              <input name="frete" type="number" min="0" step="0.01" defaultValue="0" />
            </label>
            <label className="larga">
              Observações
              <input name="observacoes" placeholder="Vendedor, procedência, condição de pagamento" />
            </label>
            <button>Cadastrar lote</button>
          </form>
        </div>
      </div>
    </>
  )
}
