import { dia, tracarSerie } from '@/lib/campos'

const L = 720
const A = 240
const M = 34

type Ponto = { data: string; valor: number }

/** Linha no tempo: peso de um animal, cotação de uma praça, o que vier.
 *  SVG puro — sem biblioteca, sem JS no cliente. */
export function GraficoSerie({
  serie,
  sufixo = '',
  formatar = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
}: {
  serie: Ponto[]
  sufixo?: string
  formatar?: (v: number) => string
}) {
  const g = tracarSerie(serie, L, A, M)
  if (!g) return null

  const { pontos, min, max, emY } = g
  const linha = pontos.map((p) => `${p.x},${p.y}`).join(' ')
  const primeiro = pontos[0]
  const ultimo = pontos[pontos.length - 1]
  const grades = [min, (min + max) / 2, max]

  return (
    <figure className="grafico">
      <svg viewBox={`0 0 ${L} ${A}`} role="img" aria-label={`Evolução ao longo do tempo${sufixo}`}>
        {grades.map((v) => (
          <g key={v}>
            <line x1={M} x2={L - M} y1={emY(v)} y2={emY(v)} className="grade" />
            <text x={M - 8} y={emY(v)} className="eixo" textAnchor="end" dominantBaseline="middle">
              {Math.round(v)}
            </text>
          </g>
        ))}

        <polyline points={linha} className="traco" />

        {pontos.map((p, i) => {
          // a dica não pode vazar pelas bordas nem cobrir o topo do gráfico
          const dx = Math.min(Math.max(p.x, 58), L - 58)
          const acima = p.y > M + 44
          return (
            <g key={`${p.data}-${i}`} className="pt">
              <title>{`${dia(p.data)} — ${formatar(p.valor)}${sufixo}`}</title>
              <circle cx={p.x} cy={p.y} r={5} className="marca" />
              <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
              <g className="dica" transform={`translate(${dx}, ${p.y})`}>
                <rect x={-56} y={acima ? -38 : 16} width={112} height={22} rx={4} />
                <text textAnchor="middle" y={acima ? -23 : 31}>
                  {dia(p.data)} · {formatar(p.valor)}
                  {sufixo}
                </text>
              </g>
            </g>
          )
        })}

        {/* rótulo só nas pontas: número em todo ponto vira ruído */}
        <text x={primeiro.x} y={A - 10} className="eixo" textAnchor="start">
          {dia(primeiro.data)}
        </text>
        <text x={ultimo.x} y={A - 10} className="eixo" textAnchor="end">
          {dia(ultimo.data)}
        </text>
        <circle cx={ultimo.x} cy={ultimo.y} r={5} className="marca atual" />
      </svg>
    </figure>
  )
}

const LG = 720
const AG = 230
const MG = 40

type Periodo = { de: string; ate: string; dias: number; cabecas: number; ganho: number; gmd: number }

/** Ganho médio diário do lote, uma barra por período entre pesagens.
 *  Barra é a forma certa aqui: cada valor é a média de um intervalo, não uma
 *  medição instantânea — e a largura acompanha a duração real do período. */
export function GraficoGmd({ periodos }: { periodos: Periodo[] }) {
  if (!periodos.length) return null

  const t0 = Date.parse(periodos[0].de)
  const span = Date.parse(periodos[periodos.length - 1].ate) - t0 || 1
  const emX = (d: string) => MG + ((Date.parse(d) - t0) / span) * (LG - MG * 2)

  const valores = periodos.map((p) => p.gmd)
  const teto = Math.max(...valores, 0)
  const piso = Math.min(...valores, 0)
  const folga = (teto - piso) * 0.18 || 0.2
  const alto = teto + folga
  const baixo = piso - (piso < 0 ? folga : 0)
  const emY = (v: number) => MG / 2 + (1 - (v - baixo) / (alto - baixo)) * (AG - MG)
  const zero = emY(0)

  return (
    <figure className="grafico gmd">
      <svg viewBox={`0 0 ${LG} ${AG}`} role="img" aria-label="Ganho médio diário do lote por período">
        {periodos.map((p) => {
          const x = emX(p.de)
          const larg = Math.max(emX(p.ate) - x - 3, 6)
          const y = p.gmd >= 0 ? emY(p.gmd) : zero
          const altura = Math.max(Math.abs(emY(p.gmd) - zero), 2)
          const meio = x + larg / 2
          return (
            <g key={p.ate} className="pt">
              <title>
                {`${dia(p.de)} a ${dia(p.ate)} — ${p.gmd.toFixed(3).replace('.', ',')} kg/dia · ` +
                  `${p.ganho.toFixed(1).replace('.', ',')} kg em ${p.dias} dias · ${p.cabecas} cabeças`}
              </title>
              <rect
                x={x}
                y={y}
                width={larg}
                height={altura}
                rx={4}
                className={p.gmd >= 0 ? 'barra-ganho' : 'barra-perda'}
              />
              {/* rótulo direto: a cor nunca é o único sinal do sinal do valor */}
              <text x={meio} y={p.gmd >= 0 ? y - 7 : y + altura + 15} className="valor" textAnchor="middle">
                {p.gmd.toFixed(2).replace('.', ',')}
              </text>
              <text x={meio} y={AG - 6} className="eixo" textAnchor="middle">
                {dia(p.ate).slice(0, 5)}
              </text>
            </g>
          )
        })}
        <line x1={MG} x2={LG - MG} y1={zero} y2={zero} className="zero" />
        <text x={MG - 8} y={zero} className="eixo" textAnchor="end" dominantBaseline="middle">
          0
        </text>
      </svg>
    </figure>
  )
}
