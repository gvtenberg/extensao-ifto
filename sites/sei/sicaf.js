// v0.10.0: SICAF automático (spec sicaf-automatico). Na CGOC, com um processo aberto, lê a árvore (notas
// fiscais, atestes, Folha de Encaminhamento e Sicafs já incluídos) e avisa na barra da extensão
// "N notas sem SICAF – Buscar". Nada abre antes do clique (decisão D2).
(async function () {
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { sicaf: regras, configuracoes, barra, seiPedidos, pdfTexto } = ExtensaoIFTO
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  const quadroArvore = document.getElementById('ifrArvore')
  if (!barra || !campoUnidade || !quadroArvore) return
  const unidade = campoUnidade.textContent.trim()
  const navegador = globalThis.browser || globalThis.chrome

  let opcoes = await configuracoes.lerConfiguracoes()
  const ID = 'sicaf'
  const botao = barra.botao(ID, { texto: 'Notas sem SICAF', titulo: '', ordem: 15, aoClicar: () => clicou() })
  const escreverNoBotao = texto => { botao.lastChild.textContent = ' ' + texto }
  const avisoLigado = () => regras.ehCgoc(unidade) && regras.funcaoLigada(opcoes.incluirSicaf, unidade)

  // ---------- Leitura do processo ----------
  // O que já foi lido não é lido de novo (o documento não muda depois de assinado ou incluído).
  const atestesLidos = new Map()
  const sicafsLidos = new Map()
  async function lerAteste (doc) {
    if (!atestesLidos.has(doc.id)) {
      atestesLidos.set(doc.id, seiPedidos.pedir(doc.link).then(pagina => regras.lerAteste(regras.textoDoHtml(pagina.html))).catch(() => []))
    }
    return atestesLidos.get(doc.id)
  }
  async function cnpjsDoSicaf (doc) {
    if (!sicafsLidos.has(doc.id)) {
      sicafsLidos.set(doc.id, seiPedidos.baixar(doc.link).then(bytes => pdfTexto.textoDoPdf(bytes)).then(regras.acharCnpjs).catch(() => []))
    }
    return sicafsLidos.get(doc.id)
  }

  // Situação do processo aberto: notas pendentes e o que já existe depois da última Folha.
  async function analisar () {
    const lida = seiPedidos.arvoreAberta()
    if (!lida) return null
    const inicial = regras.situacaoDoProcesso(lida.documentos)
    if (!inicial.notas.length) return { lida, situacao: inicial }
    const atestes = {}
    for (const doc of inicial.atestes) atestes[doc.id] = await lerAteste(doc)
    const cnpjsDosSicafs = {}
    for (const doc of inicial.sicafs) cnpjsDosSicafs[doc.id] = await cnpjsDoSicaf(doc)
    return { lida, situacao: regras.situacaoDoProcesso(lida.documentos, { atestes, cnpjsDosSicafs }) }
  }

  // ---------- Aviso na barra ----------
  let atual = null
  let vez = 0
  async function atualizar () {
    if (!avisoLigado()) { barra.mostrar(ID, false); return }
    const minhaVez = ++vez
    let resultado = null
    try { resultado = await analisar() } catch (erro) { resultado = null }
    if (minhaVez !== vez) return
    atual = resultado
    const pendentes = resultado ? resultado.situacao.pendentes : []
    if (!pendentes.length) { barra.mostrar(ID, false); return }
    escreverNoBotao(regras.textoDoAviso(pendentes.length) + ' – Buscar')
    botao.title = 'Notas fiscais depois da última Folha de Encaminhamento sem SICAF:\n' +
      pendentes.map(nota => `Nota ${nota.numero || '?'} – ${nota.fornecedor || 'fornecedor não identificado'}`).join('\n')
    barra.mostrar(ID, true)
  }

  // A árvore recarrega sozinha (documento incluído, processo trocado): lê de novo.
  let espera = null
  const atualizarDepois = () => { clearTimeout(espera); espera = setTimeout(atualizar, 400) }
  quadroArvore.addEventListener('load', atualizarDepois)

  // ---------- Clique ----------
  async function clicou () {
    // Etapa 1: só avisa. A busca no SICAF vem nas próximas etapas.
    if (!atual) return
    window.alert(botao.title)
  }

  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local' || !mudancas.configuracoes) return
    opcoes = await configuracoes.lerConfiguracoes()
    atualizarDepois()
  })

  atualizarDepois()
})()
