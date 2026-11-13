// v0.7.0: botão "Incluir Sicaf, Consulta e Anexo" na barra da extensão (spec documentos-pagamento).
// Só com um processo aberto (página com a árvore, #ifrArvore).
// v0.9.0 (decisão D8): depois da confirmação, a extensão envia os formulários do SEI direto, sem abrir as
// telas (como o próprio SEI faria): Incluir Documento › Externo, uma vez; depois, para cada tipo, escolher o
// tipo (o SEI devolve o formulário do tipo) e Salvar com data de hoje, Nato-digital e Público. No fim,
// recarrega a árvore para os documentos aparecerem. Substitui os passos pelas telas da v0.8.0.
(async function () {
  if (window.top !== window) return
  const { documentosPagamento: regras, documentoExterno, configuracoes, barra } = globalThis.ExtensaoIFTO
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  if (!barra || !campoUnidade || !document.getElementById('ifrArvore')) return
  const unidade = campoUnidade.textContent.trim()
  const navegador = globalThis.browser || globalThis.chrome
  const CHAVE_FEITOS = 'documentosPagamentoFeitos'
  // Tarefa dos passos pelas telas (até a v0.8.1): não é mais usada; apaga se ficou guardada.
  navegador.storage.local.remove('documentosPagamentoTarefa')

  let opcoes = await configuracoes.lerConfiguracoes()
  const ID = 'documentos-pagamento'
  const textoDoBotao = 'Incluir ' + regras.listaEmTexto(regras.TIPOS)
  const botao = barra.botao(ID, {
    texto: textoDoBotao,
    titulo: 'Incluir no processo os documentos externos em branco: ' + regras.listaEmTexto(regras.TIPOS),
    ordem: 20,
    aoClicar: () => clicou()
  })
  const desenhar = () => barra.mostrar(ID, regras.funcaoLigada(opcoes.documentosPagamento, unidade))
  const escreverNoBotao = texto => { botao.lastChild.textContent = ' ' + texto }

  // ---------- Árvore do processo (sites/sei/sei-pedidos.js desde v0.10.0) ----------
  const { arvoreAberta: arvore, recarregarArvore } = globalThis.ExtensaoIFTO.seiPedidos

  // ---------- Feitos hoje (aviso D5) ----------
  async function feitosHoje (idProcesso) {
    const { [CHAVE_FEITOS]: feitos } = await navegador.storage.local.get(CHAVE_FEITOS)
    return Boolean(feitos && feitos[idProcesso] === documentoExterno.dataDeHoje())
  }
  async function marcarFeitosHoje (idProcesso) {
    const { [CHAVE_FEITOS]: feitos = {} } = await navegador.storage.local.get(CHAVE_FEITOS)
    const hoje = documentoExterno.dataDeHoje()
    // Guarda só os de hoje: a lista não cresce.
    const novos = Object.fromEntries(Object.entries(feitos).filter(([, data]) => data === hoje))
    novos[idProcesso] = hoje
    await navegador.storage.local.set({ [CHAVE_FEITOS]: novos })
  }

  // ---------- Inclusão (sites/sei/sei-pedidos.js desde v0.14.0, também usada pelo SICAF automático) ----------
  function incluirDireto (lida, tipos, opcoesDaInclusao) {
    return globalThis.ExtensaoIFTO.seiPedidos.incluirExternos(lida, tipos.map(tipo => ({ tipo })), opcoesDaInclusao)
  }

  // ---------- Clique no botão ----------
  let andamento = null // { parar } enquanto inclui
  async function clicou () {
    if (andamento) {
      if (window.confirm('Parar a inclusão?')) andamento.parar = true
      return
    }
    const lida = arvore()
    if (!lida) {
      window.alert('Não consegui ler a árvore do processo. Espere o processo abrir por completo e tente de novo.')
      return
    }
    const pergunta = regras.textoDaConfirmacao({
      jaIncluidosHoje: await feitosHoje(lida.idProcesso),
      emBranco: regras.documentosEmBranco(lida.documentos)
    })
    if (!window.confirm(pergunta)) return
    const tipos = [...regras.TIPOS]
    const incluidos = []
    andamento = { parar: false }
    let erro = null
    try {
      await incluirDireto(lida, tipos, {
        incluidos,
        deveParar: () => andamento.parar,
        aoAvancar: posicao => escreverNoBotao(`Incluindo ${tipos[posicao]} (${posicao + 1}/${tipos.length})…`)
      })
    } catch (falha) {
      erro = falha
    }
    const parou = andamento.parar
    andamento = null
    if (incluidos.length) { await marcarFeitosHoje(lida.idProcesso); recarregarArvore() }
    if (erro || parou) {
      escreverNoBotao(textoDoBotao)
      const feitos = incluidos.length ? 'Incluídos: ' + regras.listaEmTexto(incluidos) + '.' : 'Nenhum documento foi incluído.'
      window.alert((erro ? erro.message : 'Inclusão parada.') + '\n' + feitos)
      return
    }
    // Como no SEI: sem janela no fim; a árvore recarrega e o botão confirma por alguns segundos.
    escreverNoBotao('Incluídos ✓')
    setTimeout(() => { if (!andamento) escreverNoBotao(textoDoBotao) }, 3000)
  }

  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local' || !mudancas.configuracoes) return
    opcoes = await configuracoes.lerConfiguracoes()
    desenhar()
  })

  desenhar()
})()
