// v0.35.0: lista de documentos para a direção assinar (spec lista-para-direcao). Regras puras: montar a lista,
// itens repetidos, texto para o WhatsApp, quem assina hoje e a tela "Atribuir Processo" do SEI. Testadas no Node.
(function (raiz) {
  const noNode = typeof module !== 'undefined' && module.exports
  const sei = noNode ? require('./sei.js') : raiz.ExtensaoIFTO.sei
  const listaAssinaturas = noNode ? require('./lista-assinaturas.js') : raiz.ExtensaoIFTO.listaAssinaturas

  const limpar = texto => String(texto || '').replace(/\s+/g, ' ').trim()
  const semAcentos = texto => limpar(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  // ---------- Documentos da árvore ----------
  // Número SEI no fim do nome: "Despacho 163 (3229092)" ou, sem número próprio, "Ateste Fatura Materiais 3375110".
  function numeroDoDocumento (rotulo) {
    const achado = /(?:\((\d{6,9})\)|(?:^|\s)(\d{6,9}))\s*$/.exec(String(rotulo || ''))
    return achado ? achado[1] || achado[2] : ''
  }
  // D2: assinado por esta pessoa (a árvore mostra nome, cargo e unidade, um por linha).
  function assinadoPor (linhas, nome) {
    const procurado = semAcentos(nome)
    return Boolean(procurado) && (linhas || []).some(linha => semAcentos(linha) === procurado)
  }
  // Documento da árvore lida (comum/sei.js) como item novo da lista.
  function itemDoDocumento (documento, processo, idProcesso, soCiencia) {
    return {
      processo,
      idProcesso,
      documento: numeroDoDocumento(documento.rotulo),
      nome: limpar(documento.rotulo),
      soCiencia: Boolean(soCiencia),
      comentario: arrumarComentario('', soCiencia)
    }
  }

  // ---------- Comentário e texto copiado ----------
  // O comentário não pode ser lido pelo painel da direção como outro documento: "3384598 ..." ou "a 3384598"
  // no começo ganha "obs.:". Item só de ciência sempre tem a palavra "ciência".
  function arrumarComentario (texto, soCiencia) {
    let comentario = limpar(texto).replace(/^[\s\-–—;,•*·]+/, '')
    if (/^(?:(?:a|até|ate|e)\s*)?\d{6,9}(?!\d)/i.test(comentario)) comentario = 'obs.: ' + comentario
    if (soCiencia && !listaAssinaturas.ehCiencia(comentario)) comentario = comentario ? 'ciência – ' + comentario : 'ciência'
    return comentario
  }
  // O painel da direção mostra "Só dar ciência" sempre que o comentário tem a palavra.
  const ehCiencia = item => listaAssinaturas.ehCiencia(item.comentario)

  // D5: uma linha por processo; comentário diferente vai em outra linha. Fica na ordem da lista.
  function textoParaCopiar (itens) {
    const linhas = []
    for (const item of itens || []) {
      const ultima = linhas[linhas.length - 1]
      if (ultima && ultima.processo === item.processo && ultima.comentario === item.comentario) ultima.documentos.push(item.documento)
      else linhas.push({ processo: item.processo, comentario: item.comentario, documentos: [item.documento] })
    }
    return linhas.map(linha => `${linha.processo} - ${linha.documentos.join(', ')}${linha.comentario ? ' ' + linha.comentario : ''}`).join('\n')
  }

  // ---------- Lista ----------
  const naLista = (itens, documento) => (itens || []).some(item => item.documento === documento)
  // Lista enviada mais recente com o documento (ou null).
  function enviadaCom (enviadas, documento) {
    return [...(enviadas || [])].sort((a, b) => String(b.em).localeCompare(String(a.em))).find(lista => naLista(lista.itens, documento)) || null
  }
  // Entra junto dos outros do mesmo processo (uma linha por processo no texto); repetido não entra.
  function adicionar (itens, novo) {
    if (!novo.documento || !novo.processo || naLista(itens, novo.documento)) return itens
    const ultimo = itens.map(item => item.processo).lastIndexOf(novo.processo)
    const posicao = ultimo === -1 ? itens.length : ultimo + 1
    return [...itens.slice(0, posicao), novo, ...itens.slice(posicao)]
  }
  const remover = (itens, documento) => itens.filter(item => item.documento !== documento)
  // Sobe (-1) ou desce (1) o documento dentro do processo dele.
  function moverDocumento (itens, documento, passo) {
    const posicao = itens.findIndex(item => item.documento === documento)
    const outro = posicao + passo
    if (posicao < 0 || !itens[outro] || itens[outro].processo !== itens[posicao].processo) return itens
    const novos = [...itens]
    novos[posicao] = itens[outro]
    novos[outro] = itens[posicao]
    return novos
  }
  function porProcesso (itens) {
    const grupos = []
    for (const item of itens || []) {
      const grupo = grupos.find(g => g.processo === item.processo)
      if (grupo) grupo.itens.push(item)
      else grupos.push({ processo: item.processo, idProcesso: item.idProcesso, itens: [item] })
    }
    return grupos
  }
  function moverProcesso (itens, processo, passo) {
    const grupos = porProcesso(itens)
    const posicao = grupos.findIndex(g => g.processo === processo)
    const outro = posicao + passo
    if (posicao < 0 || !grupos[outro]) return itens
    const guardado = grupos[posicao]
    grupos[posicao] = grupos[outro]
    grupos[outro] = guardado
    return grupos.flatMap(g => g.itens)
  }

  // D7: listas enviadas há mais dias que o prazo saem; prazo inválido não apaga nada.
  function enviadasNoPrazo (enviadas, opcoes, agora) {
    const dias = Number(opcoes.direcaoApagarDias)
    if (!opcoes.direcaoApagar || !Number.isInteger(dias) || dias < 1) return enviadas
    const limite = agora.getTime() - dias * 24 * 60 * 60 * 1000
    return enviadas.filter(lista => !(new Date(lista.em).getTime() < limite))
  }

  // ---------- Quem assina ----------
  function diaDe (data) {
    const dois = n => String(n).padStart(2, '0')
    return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`
  }
  const dataEmTexto = dia => String(dia || '').split('-').reverse().join('/')
  // D12: substituto com data final (que conta); sem data inicial, já vale. Fora do período, o diretor.
  function quemAssina (opcoes, hoje) {
    const dia = diaDe(hoje)
    const inicio = opcoes.direcaoSubstitutoInicio
    const fim = opcoes.direcaoSubstitutoFim
    if ((opcoes.direcaoSubstitutoNome || opcoes.direcaoSubstitutoMatricula) && fim && dia <= fim && (!inicio || inicio <= dia)) {
      return { matricula: limpar(opcoes.direcaoSubstitutoMatricula), nome: limpar(opcoes.direcaoSubstitutoNome), ate: fim, substituto: true }
    }
    if (!opcoes.direcaoDiretorNome && !opcoes.direcaoDiretorMatricula) return null
    return { matricula: limpar(opcoes.direcaoDiretorMatricula), nome: limpar(opcoes.direcaoDiretorNome), ate: '', substituto: false }
  }
  // Barra do alto do SEI: "Nome (2382960/IFTO)".
  function matriculaDoUsuario (titulo) {
    const achado = /\(([^()/]+)\/[^()]*\)\s*$/.exec(String(titulo || ''))
    return achado ? achado[1].trim() : ''
  }
  // D9: só a chefia registrada atribui, e só para quem está assinando.
  function podeAtribuir (opcoes, matricula, hoje) {
    const pessoa = quemAssina(opcoes, hoje)
    return Boolean(opcoes.direcaoAtribuir && matricula && limpar(opcoes.direcaoChefeMatricula) === matricula && pessoa && pessoa.matricula)
  }
  const ligada = (opcoes, unidade) => Boolean(opcoes.listaDirecao) && sei.ligadaNaUnidade('automatica', unidade, sei.UNIDADE_DIRECAO_GERAL)

  // ---------- Tela "Atribuir Processo" ----------
  // Opções da lista do SEI: { valor (número interno), texto ("matrícula - nome"), marcada }.
  function lerPessoas (opcoes) {
    return (opcoes || []).map(({ valor, texto, marcada }) => {
      const achado = /^(\S+)\s+-\s+(.+)$/.exec(limpar(texto))
      return achado && valor && valor !== 'null' ? { id: valor, matricula: achado[1], nome: achado[2], atual: Boolean(marcada) } : null
    }).filter(Boolean)
  }
  // O que fazer ao atribuir para a matrícula: 'ja-esta', 'atribuir', 'perguntar' (D15: está com outra pessoa)
  // ou 'nao-esta-na-lista' (D11).
  function decidirAtribuicao (pessoas, matricula, matriculaDaChefia) {
    const destino = pessoas.find(pessoa => pessoa.matricula === matricula) || null
    const atual = pessoas.find(pessoa => pessoa.atual) || null
    if (!destino) return { acao: 'nao-esta-na-lista', destino, atual }
    if (atual === destino) return { acao: 'ja-esta', destino, atual }
    return { acao: !atual || atual.matricula === matriculaDaChefia ? 'atribuir' : 'perguntar', destino, atual }
  }

  const api = {
    numeroDoDocumento, assinadoPor, itemDoDocumento, arrumarComentario, ehCiencia, textoParaCopiar, naLista, enviadaCom, adicionar, remover,
    moverDocumento, porProcesso, moverProcesso, enviadasNoPrazo, dataEmTexto, quemAssina, matriculaDoUsuario, podeAtribuir, ligada,
    lerPessoas, decidirAtribuicao
  }
  if (noNode) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { listaDirecao: api })
})(globalThis)
