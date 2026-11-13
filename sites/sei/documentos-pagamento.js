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

  // ---------- Árvore do processo (quadro ifrArvore) ----------
  function arvore () {
    let documentoDaArvore
    try { documentoDaArvore = document.getElementById('ifrArvore').contentDocument } catch (erro) { return null }
    if (!documentoDaArvore) return null
    const texto = [...documentoDaArvore.scripts].map(script => script.textContent).join('\n')
    const lida = regras.lerArvore(texto)
    lida.linkIncluir = (/<a href="(controlador\.php\?acao=documento_escolher_tipo[^"]*)"/.exec(texto) || [])[1] || null
    return lida.idProcesso ? lida : null
  }
  function recarregarArvore () {
    const quadro = document.getElementById('ifrArvore')
    try { quadro.contentWindow.location.reload() } catch (erro) { quadro.setAttribute('src', quadro.getAttribute('src')) }
  }

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

  // ---------- Conversa com o SEI (formulários enviados direto) ----------
  // O SEI responde em ISO-8859-1: lê os bytes e decodifica (o .text() leria como UTF-8).
  async function pedir (endereco, corpo) {
    const resposta = await fetch(endereco, {
      method: corpo ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: corpo ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
      body: corpo || undefined
    })
    if (!resposta.ok) throw new Error('O SEI não respondeu (erro ' + resposta.status + '). Tente de novo.')
    const html = new TextDecoder('windows-1252').decode(await resposta.arrayBuffer())
    return { endereco: resposta.url || endereco, html }
  }
  const lerHtml = html => new DOMParser().parseFromString(html, 'text/html')

  // Campos que o navegador enviaria ao clicar em Salvar (mesmas regras do envio de formulário).
  function camposDoFormulario (formulario) {
    const campos = []
    for (const campo of formulario.elements) {
      const nome = campo.getAttribute('name')
      if (!nome || campo.hasAttribute('disabled')) continue
      const tag = campo.tagName.toLowerCase()
      const tipo = (campo.getAttribute('type') || '').toLowerCase()
      if (tag === 'button' || ['button', 'submit', 'reset', 'image', 'file'].includes(tipo)) continue
      if (tag === 'select') {
        const opcoesDaLista = [...campo.options]
        let escolhidas = opcoesDaLista.filter(opcao => opcao.hasAttribute('selected'))
        if (!campo.multiple && !escolhidas.length && opcoesDaLista.length && !(Number(campo.getAttribute('size')) > 1)) escolhidas = [opcoesDaLista[0]]
        if (!campo.multiple) escolhidas = escolhidas.slice(-1)
        for (const opcao of escolhidas) campos.push([nome, opcao.getAttribute('value') !== null ? opcao.getAttribute('value') : opcao.textContent])
      } else if (tag === 'textarea') {
        campos.push([nome, campo.textContent])
      } else if (tipo === 'radio' || tipo === 'checkbox') {
        if (campo.hasAttribute('checked')) campos.push([nome, campo.getAttribute('value') || 'on'])
      } else {
        campos.push([nome, campo.getAttribute('value') || ''])
      }
    }
    return campos
  }
  async function enviar (formulario, enderecoDaPagina, novos) {
    const destino = new URL(formulario.getAttribute('action'), enderecoDaPagina).href
    return pedir(destino, regras.montarCorpo(regras.trocarCampos(camposDoFormulario(formulario), novos)))
  }
  function formularioDoExterno (pagina) {
    return lerHtml(pagina.html).getElementById('frmDocumentoCadastro')
  }

  // Inclui os tipos um a um. aoAvancar(posição) atualiza o botão; deveParar() vê se a pessoa pediu para parar.
  async function incluirDireto (lida, tipos, { aoAvancar, deveParar, incluidos }) {
    if (!lida.linkIncluir) throw new Error('Não achei "Incluir Documento" na árvore do processo.')
    // Incluir Documento › Externo (escolher(-1) do SEI): devolve o formulário do documento externo novo.
    let pagina = await pedir(new URL(lida.linkIncluir.replace(/&amp;/g, '&'), location.href).href)
    const escolherTipo = lerHtml(pagina.html).getElementById('frmDocumentoEscolherTipo')
    if (!escolherTipo) throw new Error('O SEI não abriu "Incluir Documento". Confira se a sessão do SEI ainda está aberta.')
    const paginaEmBranco = await enviar(escolherTipo, pagina.endereco, { hdnIdSerie: '-1' })
    if (!formularioDoExterno(paginaEmBranco)) throw new Error('O SEI não abriu o documento externo.')

    for (let posicao = 0; posicao < tipos.length; posicao++) {
      if (deveParar()) return
      const tipo = tipos[posicao]
      aoAvancar(posicao)
      // 1º: escolher o tipo (trocarSerie() do SEI), sempre a partir do formulário em branco.
      const emBranco = formularioDoExterno(paginaEmBranco)
      const lista = emBranco.querySelector('#selSerie')
      const opcao = lista && regras.acharOpcao([...lista.options].map(item => ({ valor: item.getAttribute('value'), texto: item.textContent })), tipo)
      if (!opcao) throw new Error(`O tipo de documento "${tipo}" não aparece na lista do SEI.`)
      pagina = await enviar(emBranco, paginaEmBranco.endereco, { hdnIdSerie: opcao.valor, selSerie: opcao.valor })
      const doTipo = formularioDoExterno(pagina)
      // O tipo ficou se o SEI devolve o formulário com ele (no campo escondido ou marcado na lista).
      const serie = doTipo && doTipo.querySelector('#hdnIdSerie')
      const marcada = doTipo && doTipo.querySelector('#selSerie option[selected]')
      if (!doTipo || ((serie && serie.getAttribute('value')) !== opcao.valor && (marcada && marcada.getAttribute('value')) !== opcao.valor)) {
        throw new Error(`O SEI não aceitou o tipo "${tipo}".`)
      }
      // 2º: Salvar (confirmarDados() do SEI) com data de hoje, Nato-digital e Público; nível público limpa
      // grau de sigilo e hipótese legal (alterarNivelAcesso() do SEI).
      const novos = { hdnIdSerie: opcao.valor, selSerie: opcao.valor, txtDataElaboracao: documentoExterno.dataDeHoje(), rdoFormato: 'N', rdoNivelAcesso: '0', hdnFlagDocumentoCadastro: '2' }
      for (const nome of ['selGrauSigilo', 'selHipoteseLegal']) {
        const listaNula = doTipo.querySelector(`select[name="${nome}"]`)
        if (listaNula && [...listaNula.options].some(item => item.getAttribute('value') === 'null')) novos[nome] = 'null'
      }
      pagina = await enviar(doTipo, pagina.endereco, novos)
      // Se o SEI devolve o formulário de novo, não salvou.
      if (formularioDoExterno(pagina)) throw new Error(regras.mensagemDoSei(pagina.html) || `O SEI não salvou o documento "${tipo}".`)
      incluidos.push(tipo)
    }
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
