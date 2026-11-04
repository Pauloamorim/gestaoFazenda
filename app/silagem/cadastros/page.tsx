import { listarAreasSilagem, listarDepositosSilagem } from '@/lib/dados'
import { CULTURAS_SILAGEM } from '@/lib/silagem'
import {
  atualizarAreaSilagem,
  atualizarDepositoSilagem,
  criarAreaSilagem,
  criarDepositoSilagem,
} from '../../actions'
import { Excluir, Vazio } from '../../componentes'

function CamposArea({ a }: { a?: any }) {
  return (
    <>
      <label>Nome<input name="nome" required defaultValue={a?.nome} placeholder="Área 1" /></label>
      <label>Cultura<input name="cultura" list="culturas-silagem" required defaultValue={a?.cultura} /></label>
      <label>Tamanho (ha)<input name="tamanho_ha" type="number" min="0.01" step="0.01" required={!a} defaultValue={a?.tamanho_ha ?? ''} /></label>
      <label className="larga">Observações<input name="observacoes" defaultValue={a?.observacoes ?? ''} /></label>
    </>
  )
}

export default async function CadastrosSilagem() {
  const [areas, depositos] = await Promise.all([listarAreasSilagem(), listarDepositosSilagem()])

  return (
    <>
      <h1>Áreas e depósitos</h1>
      <p className="sub">De onde a silagem vem (capineira, roça de milho) e onde os sacos ficam guardados.</p>
      <datalist id="culturas-silagem">{CULTURAS_SILAGEM.map((c) => <option key={c} value={c} />)}</datalist>

      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="cabeca"><h2>Áreas de plantio</h2></div>
        <div className="corpo">
          <form action={criarAreaSilagem} className="linha">
            <CamposArea />
            <button>Cadastrar área</button>
          </form>
        </div>
        {!areas.length ? (
          <Vazio titulo="Nenhuma área ainda." dica="Cadastre cada pedaço de terra que vira silagem." />
        ) : (
          <div className="corpo">
            {areas.map((a: any) => (
              <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'end', marginTop: 12 }}>
                <form action={atualizarAreaSilagem} className="linha" style={{ flex: 1 }}>
                  <input type="hidden" name="id" value={a.id} />
                  <CamposArea a={a} />
                  <button>Salvar</button>
                </form>
                <Excluir id={a.id} tabela="silagem_areas" revalidar="/silagem" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca"><h2>Depósitos</h2></div>
        <div className="corpo">
          <form action={criarDepositoSilagem} className="linha">
            <label>Nome<input name="nome" required placeholder="Novo Quartinho" /></label>
            <label className="larga">Observações<input name="observacoes" /></label>
            <button>Cadastrar depósito</button>
          </form>
        </div>
        {!depositos.length ? (
          <Vazio titulo="Nenhum depósito ainda." dica="Cadastre cada quartinho ou silo onde os sacos ficam." />
        ) : (
          <div className="corpo">
            {depositos.map((d: any) => (
              <div key={d.id} style={{ display: 'flex', gap: 12, alignItems: 'end', marginTop: 12 }}>
                <form action={atualizarDepositoSilagem} className="linha" style={{ flex: 1 }}>
                  <input type="hidden" name="id" value={d.id} />
                  <label>Nome<input name="nome" required defaultValue={d.nome} /></label>
                  <label className="larga">Observações<input name="observacoes" defaultValue={d.observacoes ?? ''} /></label>
                  <button>Salvar</button>
                </form>
                <Excluir id={d.id} tabela="silagem_depositos" revalidar="/silagem" />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
