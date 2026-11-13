// v0.11.0: CNPJ selecionado numa página do SEI (decisão D6): aparece um botão "Buscar SICAF" ao lado da
// seleção. Roda em todos os quadros do SEI (documento aberto, árvore…); o clique avisa a página principal
// pela extensão (fundo/fundo.js), que abre a janela do SICAF. v0.16.0: com "Automática", só na CGOC; nas
// outras unidades, com "Sempre ligada".
// v0.18.0 (pedido de 13/11/2026): na CGOC, um botão "Incluir SICAF, Simples e Anexo"; nas outras unidades,
// dois: "Incluir SICAF" e "Incluir Simples Nacional".
(async function () {
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { sicaf: regras, configuracoes } = ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  let opcoes = await configuracoes.lerConfiguracoes()

  let hospedeiro = null
  function esconder () {
    if (hospedeiro) hospedeiro.remove()
    hospedeiro = null
  }
  function mostrar (cnpj, retangulo, cgoc) {
    esconder()
    hospedeiro = document.createElement('div')
    hospedeiro.dataset.extensaoIfto = 'cnpj-selecionado'
    const raiz = hospedeiro.attachShadow({ mode: 'open' })
    const estilo = document.createElement('style')
    estilo.textContent = `
      :host { all: initial; }
      .botoes { position: fixed; z-index: 2147483000; display: flex; gap: 6px; }
      button { display: flex; align-items: center; gap: 6px; padding: 4px 8px;
        border-radius: 6px; border: 1px solid #C9D1CC; background: #fff; color: #1B2420; font: 13px/1.4 system-ui, sans-serif;
        cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.18); }
      button:hover { background: #E7F2EA; }
      .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
    `
    const opcoesDoBotao = cgoc
      ? [['tudo', 'Incluir SICAF, Simples e Anexo', 'Buscar o SICAF e o Simples Nacional do CNPJ ']]
      : [['sicaf', 'Incluir SICAF', 'Buscar o SICAF do CNPJ '], ['simples', 'Incluir Simples Nacional', 'Consultar o Simples Nacional do CNPJ ']]
    const caixa = document.createElement('div')
    caixa.className = 'botoes'
    for (const [quais, texto, dica] of opcoesDoBotao) {
      const botao = document.createElement('button')
      botao.type = 'button'
      const marca = document.createElement('span')
      marca.className = 'marca'
      marca.textContent = 'IFTO'
      botao.append(marca, ' ' + texto)
      botao.title = dica + regras.formatarCnpj(cnpj)
      // mousedown não pode apagar a seleção antes do clique.
      botao.addEventListener('mousedown', evento => evento.preventDefault())
      botao.addEventListener('click', () => {
        esconder()
        navegador.runtime.sendMessage({ tipo: 'sicafCnpj', cnpj, quais, origem: 'selecao' })
      })
      caixa.append(botao)
    }
    const topo = Math.min(retangulo.bottom + 6, window.innerHeight - 34)
    const esquerda = Math.min(Math.max(retangulo.left, 4), window.innerWidth - (cgoc ? 250 : 340))
    Object.assign(caixa.style, { top: Math.max(topo, 4) + 'px', left: Math.max(esquerda, 4) + 'px' })
    raiz.append(estilo, caixa)
    document.documentElement.append(hospedeiro)
  }

  // v0.16.0: unidade aberta no SEI (quadro principal, mesmo site). "Automática" = botão só na CGOC.
  function unidadeAberta () {
    try {
      const campo = window.top.document.getElementById('lnkInfraUnidade')
      return campo ? campo.textContent.trim() : ''
    } catch (erro) {
      return ''
    }
  }

  function conferir () {
    const unidade = unidadeAberta()
    if (!regras.funcaoLigada(opcoes.incluirSicaf, unidade)) { esconder(); return }
    const selecao = window.getSelection()
    const texto = selecao && selecao.rangeCount ? selecao.toString() : ''
    const achado = texto.length <= 40 ? regras.cnpjDaSelecao(texto) : null
    if (!achado || !achado.valido) { esconder(); return }
    const retangulo = selecao.getRangeAt(0).getBoundingClientRect()
    if (!retangulo.width && !retangulo.height) { esconder(); return }
    mostrar(achado.cnpj, retangulo, regras.ehCgoc(unidade))
  }

  let espera = null
  document.addEventListener('selectionchange', () => { clearTimeout(espera); espera = setTimeout(conferir, 250) })
  window.addEventListener('scroll', esconder, true)

  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local' || !mudancas.configuracoes) return
    opcoes = await configuracoes.lerConfiguracoes()
  })
})()
