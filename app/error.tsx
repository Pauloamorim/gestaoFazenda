'use client'

export default function Erro({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="cartao" style={{ maxWidth: 560 }}>
      <div className="corpo" style={{ paddingTop: 18 }}>
        <h2>Não deu certo</h2>
        <p className="aviso">{error.message || 'Erro inesperado ao falar com o banco.'}</p>
        <button className="fantasma" onClick={reset} style={{ marginTop: 14 }}>
          Tentar de novo
        </button>
      </div>
    </div>
  )
}
