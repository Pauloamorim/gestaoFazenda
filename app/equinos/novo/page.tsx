import { listarEquinos } from '@/lib/dados'
import { criarEquino } from '../../actions'
import { CamposEquino } from '../campos'


export default async function NovoEquino() {
  const equinos = await listarEquinos()
  const machos = equinos.filter((e: any) => e.sexo === 'Macho')
  const femeas = equinos.filter((e: any) => e.sexo === 'Fêmea')

  return (
    <>
      <h1>Cadastrar cavalo</h1>
      <p className="sub">Animal do plantel ou referência genealógica para compor o pedigree.</p>
      <div className="cartao" style={{ marginTop: 22 }}>
        <div className="corpo">
          <form action={criarEquino} className="linha">
            <CamposEquino machos={machos} femeas={femeas} />
            <button>Cadastrar cavalo</button>
          </form>
        </div>
      </div>
    </>
  )
}
