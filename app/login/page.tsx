import { cadastrar, entrar } from '../actions'

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams
  return (
    <div className="portao">
      <div className="caixa">
        <p className="rotulo">Fazenda</p>
        <h1>Gestão Fazenda</h1>
        <p className="sub">Lotes, custos, sanidade e peso — num lugar só.</p>

        {erro && (
          <p className="aviso" style={{ marginTop: 18, marginBottom: 0 }}>
            {erro}
          </p>
        )}

        <form>
          <label>
            E-mail
            <input name="email" type="email" required autoComplete="email" autoFocus />
          </label>
          <label>
            Senha
            <input name="senha" type="password" required minLength={6} autoComplete="current-password" />
          </label>
          <div className="par">
            <button formAction={entrar}>Entrar</button>
            <button formAction={cadastrar} className="fantasma">
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
