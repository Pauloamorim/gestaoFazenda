import { listarEquinos } from '@/lib/dados'
import { criarEquino } from '../../actions'

const FUNCOES = ['Garanhão', 'Matriz / doadora', 'Receptora', 'Potro', 'Jovem', 'Castrado']
const PELAGENS = ['Alazã', 'Baia', 'Castanha', 'Preta', 'Tordilha', 'Pampa', 'Rosilha', 'Outra']

export default async function NovoEquino() {
  const equinos = await listarEquinos()
  const machos = equinos.filter((e: any) => e.sexo === 'Macho')
  const femeas = equinos.filter((e: any) => e.sexo === 'Fêmea')

  return (
    <>
      <h1>Cadastrar equino</h1>
      <p className="sub">Animal do plantel ou referência genealógica para compor o pedigree.</p>
      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="corpo">
          <form action={criarEquino} className="linha">
            <label className="larga">Nome<input name="nome" required autoFocus placeholder="Nome completo com sufixo do criatório" /></label>
            <label>Sexo<select name="sexo" required defaultValue="Fêmea"><option>Fêmea</option><option>Macho</option></select></label>
            <label>Função<select name="funcao_reprodutiva" required defaultValue="Matriz / doadora">{FUNCOES.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label>Nascimento<input name="nascimento" type="date" /></label>
            <label>Registro ABCCMM<input name="registro_abccmm" /></label>
            <label>Status do registro<select name="status_registro" defaultValue="Sem registro"><option>Sem registro</option><option>Provisório</option><option>Definitivo</option></select></label>
            <label>Microchip<input name="microchip" /></label>
            <label>DNA<select name="dna_status" defaultValue="Não realizado"><option>Não realizado</option><option>Coletado</option><option>Em análise</option><option>Compatível</option><option>Incompatível</option></select></label>
            <label>Pelagem<input name="pelagem" list="pelagens" /></label>
            <datalist id="pelagens">{PELAGENS.map((x) => <option key={x} value={x} />)}</datalist>
            <label>Andamento<select name="andamento" defaultValue="Não avaliado"><option>Não avaliado</option><option>Marcha batida</option><option>Marcha picada</option></select></label>
            <label>Pai cadastrado<select name="pai_id" defaultValue=""><option value="">Não vincular</option>{machos.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
            <label>Ou apenas o nome do pai<input name="pai_nome" placeholder="Nome e sufixo do garanhão" /></label>
            <label>Mãe cadastrada<select name="mae_id" defaultValue=""><option value="">Não vincular</option>{femeas.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
            <label>Ou apenas o nome da mãe<input name="mae_nome" placeholder="Nome e sufixo da matriz" /></label>
            <label>Criador<input name="criador" /></label>
            <label>Proprietário<input name="proprietario" /></label>
            <label>Localização<input name="localizacao" placeholder="Haras, baia ou pasto" /></label>
            <label>Situação<select name="situacao" defaultValue="Ativo"><option>Ativo</option><option>Referência</option><option>Vendido</option><option>Transferido</option><option>Falecido</option></select></label>
            <label>Data de aquisição<input name="data_aquisicao" type="date" /></label>
            <label>Valor de aquisição (R$)<input name="valor_aquisicao" type="number" min="0" step="0.01" /></label>
            <label className="larga">Observações<textarea name="observacoes" rows={3} /></label>
            <button>Cadastrar equino</button>
          </form>
        </div>
      </div>
    </>
  )
}
