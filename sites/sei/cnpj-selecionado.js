// v0.11.0: CNPJ selecionado numa página do SEI (decisão D6): aparece um botão "Buscar SICAF" ao lado da
// seleção. Roda em todos os quadros do SEI (documento aberto, árvore…); o clique avisa a página principal
// pela extensão (fundo/fundo.js), que abre a janela do SICAF.
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
  function mostrar (cnpj, retangulo) {
    esconder()
    hospedeiro = document.createElement('div')
    hospedeiro.dataset.extensaoIfto = 'cnpj-selecionado'
    const raiz = hospedeiro.attachShadow({ mode: 'open' })
    const estilo = document.createElement('style')
    estilo.textContent = `
      :host { all: initial; }
      button { position: fixed; z-index: 2147483000; display: flex; align-items: center; gap: 6px; padding: 4px 8px;
        border-radius: 6px; border: 1px solid #C9D1CC; background: #fff; color: #1B2420; font: 13px/1.4 system-ui, sans-serif;
        cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.18); }
      button:hover { background: #E7F2EA; }
      .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
    `
    const botao = document.createElement('button')
    botao.type = 'button'
    const marca = document.createElement('span')
    marca.className = 'marca'
    marca.textContent = 'IFTO'
    botao.append(marca, ' Buscar SICAF')
    botao.title = 'Buscar o SICAF do CNPJ ' + regras.formatarCnpj(cnpj)
    const topo = Math.min(retangulo.bottom + 6, window.innerHeight - 34)
    const esquerda = Math.min(Math.max(retangulo.left, 4), window.innerWidth - 140)
    Object.assign(botao.style, { top: Math.max(topo, 4) + 'px', left: esquerda + 'px' })
    // mousedown não pode apagar a seleção antes do clique.
    botao.addEventListener('mousedown', evento => evento.preventDefault())
    botao.addEventListener('click', () => {
      esconder()
      navegador.runtime.sendMessage({ tipo: 'sicafCnpj', cnpj, origem: 'selecao' })
    })
    raiz.append(estilo, botao)
    document.documentElement.append(hospedeiro)
  }

  function conferir () {
    if (opcoes.incluirSicaf === 'desligada') { esconder(); return }
    const selecao = window.getSelection()
    const texto = selecao && selecao.rangeCount ? selecao.toString() : ''
    const achado = texto.length <= 40 ? regras.cnpjDaSelecao(texto) : null
    if (!achado || !achado.valido) { esconder(); return }
    const retangulo = selecao.getRangeAt(0).getBoundingClientRect()
    if (!retangulo.width && !retangulo.height) { esconder(); return }
    mostrar(achado.cnpj, retangulo)
  }

  let espera = null
  document.addEventListener('selectionchange', () => { clearTimeout(espera); espera = setTimeout(conferir, 250) })
  window.addEventListener('scroll', esconder, true)

  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local' || !mudancas.configuracoes) return
    opcoes = await configuracoes.lerConfiguracoes()
  })
})()
