'use client'

import { useState } from 'react'

export function SeletorGaranhao({
  garanhoes,
  inicial = '',
}: {
  garanhoes: { id: string; nome: string }[]
  inicial?: string
}) {
  const [id, setId] = useState(inicial)

  return (
    <>
      <label>
        Garanhão cadastrado
        <select name="garanhao_id" value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Não cadastrado</option>
          {garanhoes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </label>
      <label>
        Nome do garanhão externo
        <input
          name="garanhao_nome"
          required={!id}
          disabled={Boolean(id)}
          placeholder="Nome do garanhão"
        />
      </label>
    </>
  )
}
