'use client'

import { useState } from 'react'
import { CATEGORIAS_CUSTO_EQUINO } from '@/lib/equinos'
import { criarCustoEquinos } from '../../actions'

type EquinoDisponivel = {
  id: string
  nome: string
  funcao_reprodutiva: string
}

export function FormularioCustoEquinos({
  equinos,
  data,
}: {
  equinos: EquinoDisponivel[]
  data: string
}) {
  const [selecionados, setSelecionados] = useState<string[]>([])

  function alternar(id: string, marcado: boolean) {
    setSelecionados((atuais) =>
      marcado ? [...atuais, id] : atuais.filter((equinoId) => equinoId !== id),
    )
  }

  return (
    <form action={criarCustoEquinos} className="linha">
      <fieldset className="selecao-equinos">
        <legend>Equinos envolvidos</legend>
        <div className="grade-selecao-equinos">
          {equinos.map((equino) => (
            <label className="check-equino" key={equino.id}>
              <input
                type="checkbox"
                name="equino_ids"
                value={equino.id}
                checked={selecionados.includes(equino.id)}
                onChange={(evento) => alternar(equino.id, evento.target.checked)}
              />
              <span><strong>{equino.nome}</strong><small>{equino.funcao_reprodutiva}</small></span>
            </label>
          ))}
        </div>
        <small className="selecao-confirmada">
          {selecionados.length
            ? `${selecionados.length} equino${selecionados.length > 1 ? 's' : ''} selecionado${selecionados.length > 1 ? 's' : ''}.`
            : `Nenhum selecionado: o valor será dividido entre todos os ${equinos.length} equinos ativos.`}
        </small>
      </fieldset>
      <label>Categoria<input name="categoria" list="categorias-custo-equino" required /></label>
      <datalist id="categorias-custo-equino">{CATEGORIAS_CUSTO_EQUINO.map((x) => <option key={x} value={x} />)}</datalist>
      <label>Data<input name="data" type="date" required defaultValue={data} /></label>
      <label>Valor total (R$)<input name="valor" type="number" min="0.01" step="0.01" required /></label>
      <label className="larga">Descrição<input name="descricao" placeholder="Ex.: compra de ração do mês" /></label>
      <button>Lançar despesa</button>
    </form>
  )
}
