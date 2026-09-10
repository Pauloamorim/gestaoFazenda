import { notFound } from 'next/navigation'
import { carregarLote, listarFormulacoes } from '@/lib/dados'
import { brl, calcularMistura, consumoNoPeriodo, dia, fornecimentoVigente, hoje } from '@/lib/campos'
import { criarCusto, definirFornecimento } from '../../../actions'
import Link from 'next/link'
import { Excluir, Vazio } from '../../../componentes'

const CATEGORIAS = [
  'Ração',
  'Sal mineral',
  'Vacina',
  'Medicamento',
  'Veterinário',
  'Mão de obra',
  'Transporte',
  'Pasto / Arrendamento',
  'Outro',
]

export default async function Custos({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await carregarLote(id)
  if (!dados) notFound()
  const { lote, custos, compras, gastos, fornecimentos } = dados
  const formulacoes = await listarFormulacoes()

  const custoKg = new Map<string, number>(
    formulacoes.map((f: any) => [f.id, calcularMistura(f.formulacao_itens).custoKg]),
  )
  const nomeDe = (id: string) =>
    formulacoes.find((f: any) => f.id === id)?.nome ??
    fornecimentos.find((f: any) => f.formulacao_id === id)?.formulacoes?.nome ??
    '—'

  const vigente = fornecimentoVigente(fornecimentos, hoje())
  const custoRacaoDia = [...vigente].reduce((s, [id, kg]) => s + kg * (custoKg.get(id) ?? 0), 0)
  const consumido = consumoNoPeriodo(fornecimentos, lote.data_chegada, hoje())
  const racaoAcumulada = [...consumido].reduce((s, [id, kg]) => s + kg * (custoKg.get(id) ?? 0), 0)

  return (
    <>
      <div className="cartao">
        <div className="cabeca">
          <h2>Lançar custo</h2>
        </div>
        <div className="corpo">
          <form action={criarCusto} className="linha">
            <input type="hidden" name="lote_id" value={id} />
            <label>
              Categoria
              <input name="categoria" list="categorias" required placeholder="Ração" />
            </label>
            <datalist id="categorias">
              {CATEGORIAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <label className="larga">
              Descrição
              <input name="descricao" placeholder="20 sacos de ração — Agropecuária Central" />
            </label>
            <label>
              Data
              <input name="data" type="date" required defaultValue={hoje()} />
            </label>
            <label>
              Valor (R$)
              <input name="valor" type="number" min="0" step="0.01" required />
            </label>
            <button>Lançar custo</button>
          </form>
        </div>
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Fornecimento de ração</h2>
          <p className="sub" style={{ marginTop: -6 }}>
            Quantos quilos por dia o lote come de cada mistura. Mudou a quantidade? Lance uma
            linha nova com a data — a anterior vira histórico e o consumo passado continua certo.
          </p>
        </div>
        <div className="corpo">
          {!formulacoes.length ? (
            <p className="sub">
              Nenhuma formulação cadastrada. <Link href="/racao">Monte a primeira mistura</Link>.
            </p>
          ) : (
            <form action={definirFornecimento} className="linha">
              <input type="hidden" name="lote_id" value={id} />
              <label className="larga">
                Mistura
                <select name="formulacao_id" required defaultValue="">
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {formulacoes.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} — {brl(calcularMistura(f.formulacao_itens).custoKg)}/kg
                    </option>
                  ))}
                </select>
              </label>
              <label>
                A partir de
                <input name="inicio" type="date" required defaultValue={hoje()} />
              </label>
              <label>
                Quilos por dia
                <input name="kg_dia" type="number" min="0" step="any" required />
              </label>
              <button>Registrar</button>
            </form>
          )}
        </div>

        {!fornecimentos.length ? (
          <Vazio
            titulo="Nenhum fornecimento lançado."
            dica="Com ele o sistema calcula o custo diário de ração e se ainda vale segurar o lote."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>A partir de</th>
                <th>Mistura</th>
                <th className="num">Quilos por dia</th>
                <th className="num">Custo por dia</th>
                <th>Situação</th>
                <th className="acao"></th>
              </tr>
            </thead>
            <tbody>
              {fornecimentos.map((f: any) => {
                const kg = Number(f.kg_dia)
                const vale = vigente.get(f.formulacao_id) === kg && f.inicio <= hoje()
                return (
                  <tr key={f.id}>
                    <td>{dia(f.inicio)}</td>
                    <td>{nomeDe(f.formulacao_id)}</td>
                    <td className="num">{kg ? `${kg.toFixed(1)} kg` : '—'}</td>
                    <td className="num">{kg ? brl(kg * (custoKg.get(f.formulacao_id) ?? 0)) : '—'}</td>
                    <td>
                      {!kg ? (
                        <span className="etiqueta">encerrado</span>
                      ) : f.inicio > hoje() ? (
                        <span className="etiqueta">agendado</span>
                      ) : vale ? (
                        <span className="etiqueta destaque-etiqueta">em uso</span>
                      ) : (
                        <span className="etiqueta">substituído</span>
                      )}
                    </td>
                    <td className="acao">
                      <Excluir id={f.id} tabela="fornecimentos" revalidar={`/lotes/${id}`} />
                    </td>
                  </tr>
                )
              })}
              <tr className="total">
                <td colSpan={3}>Consumindo hoje</td>
                <td className="num">{brl(custoRacaoDia)}/dia</td>
                <td colSpan={2}>
                  <span className="rotulo">
                    acumulado desde a chegada: {brl(racaoAcumulada)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="cartao">
        <div className="cabeca">
          <h2>Lançamentos</h2>
        </div>
        {!custos.length && !compras.length ? (
          <Vazio titulo="Nenhum custo lançado." dica="Ração, vacina, veterinário — tudo que sair do bolso por este lote." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th className="num">Valor</th>
                <th className="acao"></th>
              </tr>
            </thead>
            <tbody>
              {custos.map((c: any) => (
                <tr key={c.id}>
                  <td>{dia(c.data)}</td>
                  <td>
                    <span className="etiqueta">{c.categoria}</span>
                  </td>
                  <td>{c.descricao ?? '—'}</td>
                  <td className="num">{brl(Number(c.valor))}</td>
                  <td className="acao">
                    <Excluir id={c.id} tabela="custos" revalidar={`/lotes/${id}`} />
                  </td>
                </tr>
              ))}
              {compras.map((c: any) => (
                <tr key={`compra-${c.id}`}>
                  <td>{dia(c.data)}</td>
                  <td>
                    <span className="etiqueta">Ração / ingrediente</span>
                  </td>
                  <td>
                    {c.ingredientes?.nome ?? 'Ingrediente'} · {Number(c.quantidade).toFixed(0)} kg
                    {c.fornecedor ? ` · ${c.fornecedor}` : ''}
                  </td>
                  <td className="num">{brl(Number(c.valor_total))}</td>
                  <td className="acao">
                    <Link href="/racao/ingredientes" title="Gerenciar no histórico de compras">
                      ver
                    </Link>
                  </td>
                </tr>
              ))}
              <tr className="total">
                <td colSpan={3}>Total do lote</td>
                <td className="num">{brl(gastos)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
