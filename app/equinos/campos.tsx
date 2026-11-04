const FUNCOES = ['Garanhão', 'Matriz / doadora', 'Receptora', 'Potro', 'Jovem', 'Castrado']
const PELAGENS = ['Alazã', 'Baia', 'Castanha', 'Preta', 'Tordilha', 'Pampa', 'Rosilha', 'Outra']

/** Campos do cadastro de equino, usados ao cadastrar e ao editar. */
export function CamposEquino({ e, machos, femeas }: { e?: any; machos: any[]; femeas: any[] }) {
  const v = (campo: string) => e?.[campo] ?? ''
  return (
    <>
      <fieldset className="grupo">
        <legend>Identificação</legend>
        <label className="larga">Nome<input name="nome" required autoFocus={!e} defaultValue={v('nome')} placeholder="Nome completo com sufixo do criatório" /></label>
        <label>Sexo<select name="sexo" required disabled={!!e} title={e ? 'O sexo não muda depois do cadastro: ciclos reprodutivos dependem dele.' : undefined} defaultValue={e?.sexo ?? 'Fêmea'}><option>Fêmea</option><option>Macho</option></select></label>
        <label>Função<select name="funcao_reprodutiva" required defaultValue={e?.funcao_reprodutiva ?? 'Matriz / doadora'}>{FUNCOES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Nascimento<input name="nascimento" type="date" defaultValue={v('nascimento')} /></label>
        <label>Pelagem<input name="pelagem" list="pelagens" defaultValue={v('pelagem')} /></label>
        <datalist id="pelagens">{PELAGENS.map((x) => <option key={x} value={x} />)}</datalist>
        <label>Andamento<select name="andamento" defaultValue={e?.andamento ?? 'Não avaliado'}><option>Não avaliado</option><option>Marcha batida</option><option>Marcha picada</option></select></label>
      </fieldset>

      <fieldset className="grupo">
        <legend>Registro</legend>
        <label>Registro ABCCMM<input name="registro_abccmm" defaultValue={v('registro_abccmm')} /></label>
        <label>Status do registro<select name="status_registro" defaultValue={e?.status_registro ?? 'Sem registro'}><option>Sem registro</option><option>Provisório</option><option>Definitivo</option></select></label>
        <label>Microchip<input name="microchip" defaultValue={v('microchip')} /></label>
        <label>DNA<select name="dna_status" defaultValue={e?.dna_status ?? 'Não realizado'}><option>Não realizado</option><option>Coletado</option><option>Em análise</option><option>Compatível</option><option>Incompatível</option></select></label>
      </fieldset>

      <fieldset className="grupo">
        <legend>Pais</legend>
        <label>Pai cadastrado<select name="pai_id" defaultValue={v('pai_id')}><option value="">Não vincular</option>{machos.map((x: any) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></label>
        <label>Ou só o nome do pai<input name="pai_nome" defaultValue={v('pai_nome')} placeholder="Nome e sufixo do garanhão" /></label>
        <label>Mãe cadastrada<select name="mae_id" defaultValue={v('mae_id')}><option value="">Não vincular</option>{femeas.map((x: any) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></label>
        <label>Ou só o nome da mãe<input name="mae_nome" defaultValue={v('mae_nome')} placeholder="Nome e sufixo da matriz" /></label>
      </fieldset>

      <fieldset className="grupo">
        <legend>Propriedade e local</legend>
        <label>Criador<input name="criador" defaultValue={v('criador')} /></label>
        <label>Proprietário<input name="proprietario" defaultValue={v('proprietario')} /></label>
        <label>Localização<input name="localizacao" defaultValue={v('localizacao')} placeholder="Haras, baia ou pasto" /></label>
        <label>Situação<select name="situacao" defaultValue={e?.situacao ?? 'Ativo'}><option>Ativo</option><option>Referência</option><option>Vendido</option><option>Transferido</option><option>Falecido</option></select></label>
        <label>Data de aquisição<input name="data_aquisicao" type="date" defaultValue={v('data_aquisicao')} /></label>
        <label>Valor de aquisição (R$)<input name="valor_aquisicao" type="number" min="0" step="0.01" defaultValue={e ? Number(e.valor_aquisicao) : ''} /></label>
        <label className="larga">Observações<textarea name="observacoes" rows={3} defaultValue={v('observacoes')} /></label>
      </fieldset>
    </>
  )
}
