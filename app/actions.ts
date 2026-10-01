'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db, ok } from '@/lib/supabase'
import { numero, numeroObrigatorio, obrigatorio, texto } from '@/lib/campos'
import { CATEGORIAS, FONTE, interpretarCotacoes } from '@/lib/cotacoes'
import { distribuirCustoEquino } from '@/lib/equinos'

// --- conta ---

export async function entrar(fd: FormData) {
  const sb = await db()
  const { error } = await sb.auth.signInWithPassword({
    email: obrigatorio(fd.get('email'), 'E-mail'),
    password: obrigatorio(fd.get('senha'), 'Senha'),
  })
  if (error) redirect('/login?erro=' + encodeURIComponent('E-mail ou senha inválidos.'))
  redirect('/lotes')
}

export async function cadastrar(fd: FormData) {
  const sb = await db()
  const { error } = await sb.auth.signUp({
    email: obrigatorio(fd.get('email'), 'E-mail'),
    password: obrigatorio(fd.get('senha'), 'Senha'),
  })
  if (error) redirect('/login?erro=' + encodeURIComponent(error.message))
  redirect('/login?erro=' + encodeURIComponent('Conta criada. Confirme o e-mail e entre.'))
}

export async function sair() {
  const sb = await db()
  await sb.auth.signOut()
  redirect('/login')
}

// --- lotes ---

export async function criarLote(fd: FormData) {
  const sb = await db()
  const lote = ok(
    await sb
      .from('lotes')
      .insert({
        nome: obrigatorio(fd.get('nome'), 'Nome do lote'),
        quantidade: numeroObrigatorio(fd.get('quantidade'), 'Quantidade'),
        custo_aquisicao: numeroObrigatorio(fd.get('custo_aquisicao'), 'Custo de aquisição'),
        frete: numero(fd.get('frete'), 'Frete') ?? 0,
        data_chegada: obrigatorio(fd.get('data_chegada'), 'Data de chegada'),
        observacoes: texto(fd.get('observacoes')),
      })
      .select('id')
      .single(),
  )
  redirect(`/lotes/${lote.id}`)
}

export async function criarAnimal(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'lote')
  const sb = await db()
  ok(
    await sb.from('animais').insert({
      lote_id,
      identificacao: obrigatorio(fd.get('identificacao'), 'Identificação'),
      caracteristicas: texto(fd.get('caracteristicas')),
      peso_inicial: numero(fd.get('peso_inicial'), 'Peso inicial'),
      idade_meses: numero(fd.get('idade_meses'), 'Idade'),
    }),
  )
  revalidatePath(`/lotes/${lote_id}`, 'layout')
}

export async function criarCusto(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'lote')
  const sb = await db()
  ok(
    await sb.from('custos').insert({
      lote_id,
      categoria: obrigatorio(fd.get('categoria'), 'Categoria'),
      descricao: texto(fd.get('descricao')),
      data: obrigatorio(fd.get('data'), 'Data'),
      valor: numeroObrigatorio(fd.get('valor'), 'Valor'),
    }),
  )
  revalidatePath(`/lotes/${lote_id}`, 'layout')
}

/** animal_id vazio = evento do lote inteiro (ex.: vacinação de todos). */
export async function criarEvento(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'lote')
  const sb = await db()
  ok(
    await sb.from('eventos').insert({
      lote_id,
      animal_id: texto(fd.get('animal_id')),
      tipo: obrigatorio(fd.get('tipo'), 'Tipo'),
      descricao: texto(fd.get('descricao')),
      peso: numero(fd.get('peso'), 'Peso'),
      data: obrigatorio(fd.get('data'), 'Data'),
    }),
  )
  revalidatePath(`/lotes/${lote_id}`, 'layout')
}

const LIMITE = 10 * 1024 * 1024

export async function enviarDocumento(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'lote')
  const arquivo = fd.get('arquivo')
  if (!(arquivo instanceof File) || !arquivo.size) throw new Error('Escolha um arquivo.')
  if (arquivo.size > LIMITE) throw new Error('O arquivo passa de 10 MB. Reduza e envie de novo.')

  const sb = await db()
  const limpo = arquivo.name.replace(/[^\w.\- ]+/g, '_').slice(-90)
  const caminho = `${lote_id}/${crypto.randomUUID()}-${limpo}`

  ok(await sb.storage.from('documentos').upload(caminho, arquivo, { contentType: arquivo.type }))
  // ponytail: se o insert falhar, sobra um arquivo órfão no bucket.
  // Custa centavos e some quando o lote é excluído; faxina automática só se virar problema.
  ok(
    await sb.from('documentos').insert({
      lote_id,
      tipo: obrigatorio(fd.get('tipo'), 'Tipo'),
      descricao: texto(fd.get('descricao')),
      caminho,
      nome: arquivo.name,
      tamanho: arquivo.size,
    }),
  )
  revalidatePath(`/lotes/${lote_id}/documentos`)
}

export async function excluirDocumento(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'lote')
  const sb = await db()
  ok(await sb.storage.from('documentos').remove([obrigatorio(fd.get('caminho'), 'arquivo')]))
  ok(await sb.from('documentos').delete().eq('id', obrigatorio(fd.get('id'), 'id')))
  revalidatePath(`/lotes/${lote_id}/documentos`)
}

// --- ração ---

export async function criarIngrediente(fd: FormData) {
  const sb = await db()
  ok(
    await sb.from('ingredientes').insert({
      nome: obrigatorio(fd.get('nome'), 'Nome'),
      observacoes: texto(fd.get('observacoes')),
    }),
  )
  revalidatePath('/racao', 'layout')
}

/** Cada carga chega com um preço; o custo do ingrediente sai da média delas. */
export async function registrarCompra(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'Lote')
  const sb = await db()

  const lote = ok(
    await sb.from('lotes').select('quantidade, saidas(quantidade)').eq('id', lote_id).single(),
  )
  const disponiveis =
    Number(lote.quantidade) -
    (lote.saidas as any[]).reduce((s, x) => s + Number(x.quantidade), 0)
  if (disponiveis <= 0) throw new Error('Escolha um lote que ainda tenha cabeças ativas.')

  ok(
    await sb.from('compras_ingrediente').insert({
      ingrediente_id: obrigatorio(fd.get('ingrediente_id'), 'Ingrediente'),
      lote_id,
      data: obrigatorio(fd.get('data'), 'Data'),
      quantidade: numeroObrigatorio(fd.get('quantidade'), 'Quantidade'),
      valor_total: numeroObrigatorio(fd.get('valor_total'), 'Valor total'),
      fornecedor: texto(fd.get('fornecedor')),
      observacoes: texto(fd.get('observacoes')),
    }),
  )
  revalidatePath('/racao', 'layout')
  revalidatePath(`/lotes/${lote_id}`, 'layout')
  revalidatePath('/lotes')
}

/** Apropria ao lote uma compra antiga, criada antes de existir esse vínculo. */
export async function atribuirCompra(fd: FormData) {
  const id = obrigatorio(fd.get('id'), 'Compra')
  const lote_id = obrigatorio(fd.get('lote_id'), 'Lote')
  const sb = await db()
  ok(await sb.from('compras_ingrediente').update({ lote_id }).eq('id', id))
  revalidatePath('/racao/ingredientes')
  revalidatePath(`/lotes/${lote_id}`, 'layout')
  revalidatePath('/lotes')
}

export async function criarFormulacao(fd: FormData) {
  const sb = await db()
  const nova = ok(
    await sb
      .from('formulacoes')
      .insert({
        nome: obrigatorio(fd.get('nome'), 'Nome'),
        observacoes: texto(fd.get('observacoes')),
      })
      .select('id')
      .single(),
  )
  redirect(`/racao/${nova.id}`)
}

export async function adicionarItem(fd: FormData) {
  const formulacao_id = obrigatorio(fd.get('formulacao_id'), 'formulação')
  const sb = await db()
  ok(
    await sb.from('formulacao_itens').insert({
      formulacao_id,
      ingrediente_id: obrigatorio(fd.get('ingrediente_id'), 'Ingrediente'),
      quantidade: numeroObrigatorio(fd.get('quantidade'), 'Quantidade'),
    }),
  )
  revalidatePath(`/racao/${formulacao_id}`)
}

// --- cotações ---

/** Busca a tabela do dia na Scot e guarda o que ainda não temos.
 *  ponytail: ignoreDuplicates deixa rodar quantas vezes quiser sem sujar nada. */
export async function atualizarCotacoes() {
  const sb = await db()
  const falhas: string[] = []

  // uma categoria quebrada não pode impedir as outras de atualizar
  for (const categoria of CATEGORIAS) {
    try {
      const resposta = await fetch(categoria.url, {
        headers: { 'User-Agent': 'GestaoFazenda/1.0 (uso proprio, fazenda)' },
        cache: 'no-store',
      })
      if (!resposta.ok) throw new Error(`a Scot respondeu ${resposta.status}`)

      const { data, precos } = interpretarCotacoes(await resposta.text())
      ok(
        await sb
          .from('cotacoes')
          .upsert(precos.map((p) => ({ data, categoria: categoria.slug, fonte: FONTE, ...p })), {
            onConflict: 'data,categoria,praca',
            ignoreDuplicates: true,
          }),
      )
    } catch (e) {
      falhas.push(`${categoria.nome} (${e instanceof Error ? e.message : e})`)
    }
  }

  revalidatePath('/cotacoes', 'layout')
  revalidatePath('/lotes', 'layout')
  if (falhas.length === CATEGORIAS.length) throw new Error(`Nenhuma cotação veio: ${falhas.join('; ')}.`)
  if (falhas.length) throw new Error(`Faltou: ${falhas.join('; ')}. As outras foram atualizadas.`)
}

export async function definirPraca(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'lote')
  const sb = await db()
  ok(
    await sb
      .from('lotes')
      .update({
        praca: obrigatorio(fd.get('praca'), 'Praça'),
        categoria: obrigatorio(fd.get('categoria'), 'Categoria'),
      })
      .eq('id', lote_id),
  )
  revalidatePath(`/lotes/${lote_id}`, 'layout')
}

// --- saídas, ração e rendimento ---

/** Morte, venda, roubo: cabeça que deixa o lote. Venda traz valor junto. */
export async function registrarSaida(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'lote')
  const sb = await db()
  const animal_id = texto(fd.get('animal_id'))
  const quantidade = animal_id ? 1 : numeroObrigatorio(fd.get('quantidade'), 'Quantidade')

  const restam = ok(await sb.from('lotes').select('quantidade, saidas(quantidade)').eq('id', lote_id).single())
  const disponiveis =
    Number(restam.quantidade) -
    (restam.saidas as any[]).reduce((s, x) => s + Number(x.quantidade), 0)
  if (quantidade > disponiveis)
    throw new Error(`O lote só tem ${disponiveis} cabeça(s) no pasto. Não dá para dar baixa em ${quantidade}.`)

  ok(
    await sb.from('saidas').insert({
      lote_id,
      animal_id,
      data: obrigatorio(fd.get('data'), 'Data'),
      tipo: obrigatorio(fd.get('tipo'), 'Tipo'),
      quantidade,
      peso_total: numero(fd.get('peso_total'), 'Peso'),
      valor_total: numero(fd.get('valor_total'), 'Valor'),
      descricao: texto(fd.get('descricao')),
    }),
  )
  revalidatePath(`/lotes/${lote_id}`, 'layout')
}

/** Nova linha por troca de quantidade — o histórico é o conjunto das linhas. */
export async function definirFornecimento(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'lote')
  const sb = await db()
  ok(
    await sb.from('fornecimentos').upsert(
      {
        lote_id,
        formulacao_id: obrigatorio(fd.get('formulacao_id'), 'Formulação'),
        inicio: obrigatorio(fd.get('inicio'), 'Início'),
        kg_dia: numeroObrigatorio(fd.get('kg_dia'), 'Quilos por dia'),
        observacoes: texto(fd.get('observacoes')),
      },
      { onConflict: 'lote_id,formulacao_id,inicio' },
    ),
  )
  revalidatePath(`/lotes/${lote_id}`, 'layout')
}

export async function definirRendimento(fd: FormData) {
  const lote_id = obrigatorio(fd.get('lote_id'), 'lote')
  const rendimento = numeroObrigatorio(fd.get('rendimento'), 'Rendimento')
  if (rendimento <= 0 || rendimento > 100) throw new Error('O rendimento fica entre 1% e 100%.')
  const sb = await db()
  ok(await sb.from('lotes').update({ rendimento }).eq('id', lote_id))
  revalidatePath(`/lotes/${lote_id}`, 'layout')
}

// --- equinos ---

export async function criarEquino(fd: FormData) {
  const sb = await db()
  const pai_id = texto(fd.get('pai_id'))
  const mae_id = texto(fd.get('mae_id'))
  const novo = ok(
    await sb
      .from('equinos')
      .insert({
        nome: obrigatorio(fd.get('nome'), 'Nome'),
        registro_abccmm: texto(fd.get('registro_abccmm')),
        status_registro: obrigatorio(fd.get('status_registro'), 'Status do registro'),
        microchip: texto(fd.get('microchip')),
        nascimento: texto(fd.get('nascimento')),
        sexo: obrigatorio(fd.get('sexo'), 'Sexo'),
        funcao_reprodutiva: obrigatorio(fd.get('funcao_reprodutiva'), 'Função reprodutiva'),
        pelagem: texto(fd.get('pelagem')),
        andamento: obrigatorio(fd.get('andamento'), 'Andamento'),
        dna_status: obrigatorio(fd.get('dna_status'), 'DNA'),
        criador: texto(fd.get('criador')),
        proprietario: texto(fd.get('proprietario')),
        valor_aquisicao: numero(fd.get('valor_aquisicao'), 'Valor de aquisição') ?? 0,
        data_aquisicao: texto(fd.get('data_aquisicao')),
        localizacao: texto(fd.get('localizacao')),
        situacao: obrigatorio(fd.get('situacao'), 'Situação'),
        pai_id,
        pai_nome: pai_id ? null : texto(fd.get('pai_nome')),
        mae_id,
        mae_nome: mae_id ? null : texto(fd.get('mae_nome')),
        observacoes: texto(fd.get('observacoes')),
      })
      .select('id')
      .single(),
  )
  revalidatePath('/equinos', 'layout')
  redirect(`/equinos/${novo.id}`)
}

export async function atualizarEquino(fd: FormData) {
  const id = obrigatorio(fd.get('id'), 'Equino')
  const sb = await db()
  const pai_id = texto(fd.get('pai_id'))
  const mae_id = texto(fd.get('mae_id'))
  ok(
    await sb
      .from('equinos')
      .update({
        nome: obrigatorio(fd.get('nome'), 'Nome'),
        registro_abccmm: texto(fd.get('registro_abccmm')),
        status_registro: obrigatorio(fd.get('status_registro'), 'Status do registro'),
        microchip: texto(fd.get('microchip')),
        nascimento: texto(fd.get('nascimento')),
        funcao_reprodutiva: obrigatorio(fd.get('funcao_reprodutiva'), 'Função reprodutiva'),
        pelagem: texto(fd.get('pelagem')),
        andamento: obrigatorio(fd.get('andamento'), 'Andamento'),
        dna_status: obrigatorio(fd.get('dna_status'), 'DNA'),
        criador: texto(fd.get('criador')),
        proprietario: texto(fd.get('proprietario')),
        valor_aquisicao: numero(fd.get('valor_aquisicao'), 'Valor de aquisição') ?? 0,
        data_aquisicao: texto(fd.get('data_aquisicao')),
        localizacao: texto(fd.get('localizacao')),
        situacao: obrigatorio(fd.get('situacao'), 'Situação'),
        pai_id,
        pai_nome: pai_id ? null : texto(fd.get('pai_nome')),
        mae_id,
        mae_nome: mae_id ? null : texto(fd.get('mae_nome')),
        observacoes: texto(fd.get('observacoes')),
      })
      .eq('id', id),
  )
  revalidatePath('/equinos', 'layout')
  revalidatePath(`/equinos/${id}`, 'layout')
}

export async function criarReproducaoEquina(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const sb = await db()
  const garanhao_id = texto(fd.get('garanhao_id'))
  ok(
    await sb.from('reproducoes_equinas').insert({
      matriz_id: obrigatorio(fd.get('matriz_id'), 'Matriz'),
      garanhao_id,
      garanhao_nome: garanhao_id ? null : obrigatorio(fd.get('garanhao_nome'), 'Garanhão externo'),
      receptora_id: texto(fd.get('receptora_id')),
      estacao: obrigatorio(fd.get('estacao'), 'Estação'),
      metodo: obrigatorio(fd.get('metodo'), 'Método'),
      status: obrigatorio(fd.get('status'), 'Status'),
      data_cobertura: texto(fd.get('data_cobertura')),
      data_coleta: texto(fd.get('data_coleta')),
      data_transferencia: texto(fd.get('data_transferencia')),
      previsao_parto: texto(fd.get('previsao_parto')),
      observacoes: texto(fd.get('observacoes')),
    }),
  )
  revalidatePath('/equinos', 'layout')
  revalidatePath(`/equinos/${equino_id}/reproducao`)
}

export async function atualizarReproducaoEquina(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const sb = await db()
  ok(
    await sb
      .from('reproducoes_equinas')
      .update({
        status: obrigatorio(fd.get('status'), 'Status'),
        previsao_parto: texto(fd.get('previsao_parto')),
        observacoes: texto(fd.get('observacoes')),
      })
      .eq('id', obrigatorio(fd.get('id'), 'Reprodução')),
  )
  revalidatePath('/equinos', 'layout')
  revalidatePath(`/equinos/${equino_id}`, 'layout')
}

export async function registrarPartoEquino(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const reproducao_id = obrigatorio(fd.get('reproducao_id'), 'Reprodução')
  const sb = await db()
  const reproducao = ok(
    await sb
      .from('reproducoes_equinas')
      .select('matriz_id, garanhao_id, garanhao_nome, potro_id')
      .eq('id', reproducao_id)
      .single(),
  )
  if (reproducao.potro_id) throw new Error('Este parto já possui um produto cadastrado.')

  const potro = ok(
    await sb
      .from('equinos')
      .insert({
        nome: obrigatorio(fd.get('nome'), 'Nome do produto'),
        nascimento: obrigatorio(fd.get('data_parto'), 'Data do parto'),
        sexo: obrigatorio(fd.get('sexo'), 'Sexo'),
        funcao_reprodutiva: 'Potro',
        pelagem: texto(fd.get('pelagem')),
        situacao: 'Ativo',
        pai_id: reproducao.garanhao_id,
        pai_nome: reproducao.garanhao_id ? null : reproducao.garanhao_nome,
        mae_id: reproducao.matriz_id,
        status_registro: 'Sem registro',
        andamento: 'Não avaliado',
        dna_status: 'Não realizado',
      })
      .select('id')
      .single(),
  )

  const { error } = await sb
    .from('reproducoes_equinas')
    .update({
      potro_id: potro.id,
      data_parto: obrigatorio(fd.get('data_parto'), 'Data do parto'),
      status: 'Parto realizado',
    })
    .eq('id', reproducao_id)
  if (error) {
    await sb.from('equinos').delete().eq('id', potro.id)
    throw new Error(error.message)
  }

  revalidatePath('/equinos', 'layout')
  revalidatePath(`/equinos/${equino_id}`, 'layout')
  redirect(`/equinos/${potro.id}`)
}

export async function criarEventoEquino(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const sb = await db()
  ok(
    await sb.from('eventos_equinos').insert({
      equino_id,
      reproducao_id: texto(fd.get('reproducao_id')),
      tipo: obrigatorio(fd.get('tipo'), 'Tipo'),
      data: obrigatorio(fd.get('data'), 'Data'),
      proxima_data: texto(fd.get('proxima_data')),
      descricao: texto(fd.get('descricao')),
      peso: numero(fd.get('peso'), 'Peso'),
    }),
  )
  revalidatePath('/equinos', 'layout')
  revalidatePath(`/equinos/${equino_id}`, 'layout')
}

export async function criarCustoEquino(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const sb = await db()
  ok(
    await sb.from('custos_equinos').insert({
      equino_id,
      reproducao_id: texto(fd.get('reproducao_id')),
      categoria: obrigatorio(fd.get('categoria'), 'Categoria'),
      descricao: texto(fd.get('descricao')),
      data: obrigatorio(fd.get('data'), 'Data'),
      valor: numeroObrigatorio(fd.get('valor'), 'Valor'),
    }),
  )
  revalidatePath('/equinos', 'layout')
  revalidatePath(`/equinos/${equino_id}`, 'layout')
  revalidatePath('/equinos/custos')
}

export async function criarCustoEquinos(fd: FormData) {
  const equino_ids = [
    ...new Set(
      fd
        .getAll('equino_ids')
        .map((id) => texto(id))
      .filter((id): id is string => Boolean(id)),
    ),
  ]

  const valorTotal = numeroObrigatorio(fd.get('valor'), 'Valor total')
  const categoria = obrigatorio(fd.get('categoria'), 'Categoria')
  const descricao = texto(fd.get('descricao'))
  const data = obrigatorio(fd.get('data'), 'Data')
  const lancamentos = distribuirCustoEquino(valorTotal, equino_ids).map((destino) => ({
    ...destino,
    categoria,
    descricao,
    data,
  }))

  const sb = await db()
  ok(await sb.from('custos_equinos').insert(lancamentos))
  revalidatePath('/equinos', 'layout')
  revalidatePath('/equinos/custos')
  for (const equino_id of equino_ids) revalidatePath(`/equinos/${equino_id}`, 'layout')
}

export async function enviarDocumentoEquino(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const arquivo = fd.get('arquivo')
  if (!(arquivo instanceof File) || !arquivo.size) throw new Error('Escolha um arquivo.')
  if (arquivo.size > LIMITE) throw new Error('O arquivo passa de 10 MB. Reduza e envie de novo.')

  const sb = await db()
  const limpo = arquivo.name.replace(/[^\w.\- ]+/g, '_').slice(-90)
  const caminho = `equinos/${equino_id}/${crypto.randomUUID()}-${limpo}`
  ok(await sb.storage.from('documentos').upload(caminho, arquivo, { contentType: arquivo.type }))
  ok(
    await sb.from('documentos_equinos').insert({
      equino_id,
      tipo: obrigatorio(fd.get('tipo'), 'Tipo'),
      descricao: texto(fd.get('descricao')),
      caminho,
      nome: arquivo.name,
      tamanho: arquivo.size,
    }),
  )
  revalidatePath(`/equinos/${equino_id}/documentos`)
}

export async function excluirDocumentoEquino(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const sb = await db()
  ok(await sb.storage.from('documentos').remove([obrigatorio(fd.get('caminho'), 'Arquivo')]))
  ok(await sb.from('documentos_equinos').delete().eq('id', obrigatorio(fd.get('id'), 'Documento')))
  revalidatePath(`/equinos/${equino_id}/documentos`)
}

const TIPOS_FOTO = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function enviarFotoEquino(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const arquivo = fd.get('arquivo')
  if (!(arquivo instanceof File) || !arquivo.size) throw new Error('Escolha uma foto.')
  if (!TIPOS_FOTO.has(arquivo.type)) throw new Error('Use uma foto JPG, PNG ou WebP.')
  if (arquivo.size > LIMITE) throw new Error('A foto passa de 10 MB. Reduza e envie de novo.')

  const sb = await db()
  const limpo = arquivo.name.replace(/[^\w.\- ]+/g, '_').slice(-90)
  const caminho = `equinos/${equino_id}/fotos/${crypto.randomUUID()}-${limpo}`
  ok(await sb.storage.from('documentos').upload(caminho, arquivo, { contentType: arquivo.type }))

  const { count, error: erroContagem } = await sb
    .from('fotos_equinos')
    .select('id', { count: 'exact', head: true })
    .eq('equino_id', equino_id)
  if (erroContagem) {
    await sb.storage.from('documentos').remove([caminho])
    throw new Error(erroContagem.message)
  }

  const resposta = await sb.from('fotos_equinos').insert({
    equino_id,
    caminho,
    nome: arquivo.name,
    legenda: texto(fd.get('legenda')),
    tamanho: arquivo.size,
    principal: count === 0,
  })
  if (resposta.error) {
    await sb.storage.from('documentos').remove([caminho])
    throw new Error(resposta.error.message)
  }
  revalidatePath(`/equinos/${equino_id}`, 'layout')
}

export async function definirFotoPrincipal(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const id = obrigatorio(fd.get('id'), 'Foto')
  const sb = await db()
  const foto = ok(
    await sb.from('fotos_equinos').select('id').eq('id', id).eq('equino_id', equino_id).maybeSingle(),
  )
  if (!foto) throw new Error('Foto não encontrada.')
  ok(await sb.from('fotos_equinos').update({ principal: false }).eq('equino_id', equino_id))
  ok(await sb.from('fotos_equinos').update({ principal: true }).eq('id', id))
  revalidatePath(`/equinos/${equino_id}`, 'layout')
}

export async function excluirFotoEquino(fd: FormData) {
  const equino_id = obrigatorio(fd.get('equino_id'), 'Equino')
  const id = obrigatorio(fd.get('id'), 'Foto')
  const sb = await db()
  const foto = ok(
    await sb
      .from('fotos_equinos')
      .select('caminho, principal')
      .eq('id', id)
      .eq('equino_id', equino_id)
      .maybeSingle(),
  )
  if (!foto) throw new Error('Foto não encontrada.')
  ok(await sb.storage.from('documentos').remove([foto.caminho]))
  ok(await sb.from('fotos_equinos').delete().eq('id', id))
  if (foto.principal) {
    const proxima = ok(
      await sb
        .from('fotos_equinos')
        .select('id')
        .eq('equino_id', equino_id)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle(),
    )
    if (proxima) ok(await sb.from('fotos_equinos').update({ principal: true }).eq('id', proxima.id))
  }
  revalidatePath(`/equinos/${equino_id}`, 'layout')
}

const TABELAS = [
  'lotes',
  'animais',
  'custos',
  'eventos',
  'ingredientes',
  'formulacoes',
  'formulacao_itens',
  'compras_ingrediente',
  'saidas',
  'fornecimentos',
  'equinos',
  'reproducoes_equinas',
  'eventos_equinos',
  'custos_equinos',
] as const

export async function excluir(fd: FormData) {
  const tabela = obrigatorio(fd.get('tabela'), 'tabela') as (typeof TABELAS)[number]
  if (!TABELAS.includes(tabela)) throw new Error('Tabela inválida.')
  const id = obrigatorio(fd.get('id'), 'id')
  const sb = await db()

  // o banco barra por chave estrangeira, mas a mensagem dele não ajuda ninguém
  if (tabela === 'ingredientes') {
    const { count } = await sb
      .from('formulacao_itens')
      .select('id', { count: 'exact', head: true })
      .eq('ingrediente_id', id)
    if (count)
      throw new Error(
        `Este ingrediente está em ${count} formulação(ões). Tire ele de lá antes de excluir.`,
      )
  }

  ok(await sb.from(tabela).delete().eq('id', id))
  if (tabela === 'compras_ingrediente') revalidatePath('/lotes', 'layout')
  if (tabela === 'custos_equinos') revalidatePath('/equinos', 'layout')
  const ir = texto(fd.get('ir'))
  if (ir) redirect(ir)
  revalidatePath(obrigatorio(fd.get('revalidar'), 'destino'), 'layout')
}
