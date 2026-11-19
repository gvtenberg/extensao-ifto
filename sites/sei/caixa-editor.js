// v0.23.0: caixa "IFTO" no canto da janela do editor do SEI e o recado para a parte de fundo, usados pela
// marca MINUTA dos editais e pela data de hoje do Ofício e da Portaria (antes ficavam só no da MINUTA).
(function (raiz) {
  const navegador = globalThis.browser || globalThis.chrome
  // v0.26.8 (T112, T117, T122, T133, T140, T142): todos os avisos numa janela só, no canto inferior direito,
  // fixa na tela e que a pessoa pode arrastar pela barra de cima (o lugar não fica salvo).
  const ESTILO = `
    :host { all: initial; }
    .caixa { position: fixed; z-index: 100000; right: 16px; bottom: 16px; width: min(340px, calc(100vw - 32px));
      max-height: calc(100vh - 32px); display: flex; flex-direction: column;
      font: 13px/1.4 system-ui, sans-serif; color: #1B2420; background: #fff; border: 1px solid #C9D1CC;
      border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.18); overflow: hidden; }
    .topo { display: flex; align-items: center; justify-content: space-between; cursor: move; user-select: none;
      background: #F1F4F2; border-bottom: 1px solid #C9D1CC; }
    .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-bottom-right-radius: 4px; }
    .titulo { flex: 1; padding: 0 8px; font-size: 12px; color: #555; }
    .fechar { border: 0; background: none; font-size: 16px; line-height: 1; padding: 2px 8px; cursor: pointer; color: #555; }
    .lista { overflow-y: auto; }
    .aviso-item { position: relative; border-top: 1px solid #E3E8E5; }
    .aviso-item:first-child { border-top: 0; }
    .aviso-item > .fechar { position: absolute; top: 2px; right: 0; }
    .corpo { padding: 8px 26px 10px 10px; }
    p { margin: 0 0 8px; }
    .aviso { color: #8A5A00; }
    .erro { color: #B3261E; }
    .ok { color: #1E5E33; font-weight: 600; }
    ul { margin: 0 0 8px; padding-left: 18px; }
    .principal { width: 100%; padding: 6px 10px; border: 0; border-radius: 4px; background: #1E5E33; color: #fff;
      font: inherit; font-weight: 600; cursor: pointer; }
    .principal:disabled { opacity: .6; cursor: default; }
  `
  const criar = (etiqueta, propriedades = {}) => Object.assign(document.createElement(etiqueta), propriedades)

  let janela = null
  // A janela única (criada no primeiro aviso; some quando o último aviso é fechado).
  function janelaDeAvisos () {
    if (janela && janela.hospedeiro.isConnected) return janela
    const hospedeiro = criar('div')
    hospedeiro.dataset.extensaoIfto = 'avisos'
    const sombra = hospedeiro.attachShadow({ mode: 'open' })
    const fechar = criar('button', { type: 'button', className: 'fechar', title: 'Fechar todos os avisos', textContent: '×' })
    const topo = criar('div', { className: 'topo', title: 'Arraste para mudar a janela de lugar' })
    topo.append(criar('span', { className: 'marca', textContent: 'IFTO' }), criar('span', { className: 'titulo', textContent: 'Avisos da extensão' }), fechar)
    const lista = criar('div', { className: 'lista' })
    const caixa = criar('div', { className: 'caixa' })
    caixa.append(topo, lista)
    sombra.append(criar('style', { textContent: ESTILO }), caixa)
    document.body.append(hospedeiro)
    fechar.addEventListener('click', () => hospedeiro.remove())
    arrastar(topo, caixa, fechar)
    janela = { hospedeiro, lista }
    return janela
  }

  // Arrastar pela barra de cima, sem deixar a janela sair da tela.
  function arrastar (topo, caixa, fechar) {
    topo.addEventListener('pointerdown', evento => {
      if (evento.button !== 0 || evento.target === fechar) return
      const inicio = caixa.getBoundingClientRect()
      const dx = evento.clientX - inicio.left
      const dy = evento.clientY - inicio.top
      topo.setPointerCapture(evento.pointerId)
      const mover = e => {
        const x = Math.min(Math.max(0, e.clientX - dx), window.innerWidth - caixa.offsetWidth)
        const y = Math.min(Math.max(0, e.clientY - dy), window.innerHeight - 30)
        Object.assign(caixa.style, { left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto' })
      }
      const soltar = () => { topo.removeEventListener('pointermove', mover); topo.removeEventListener('pointerup', soltar) }
      topo.addEventListener('pointermove', mover)
      topo.addEventListener('pointerup', soltar)
      evento.preventDefault()
    })
  }

  // Um aviso dentro da janela única, com o texto e o botão principal. Devolve { corpo, botao, mostrar(classe, texto, ...extras) }.
  // Chamado de novo com o mesmo nome, troca o aviso antigo.
  function criarCaixa (nome, texto, rotuloDoBotao) {
    const { hospedeiro, lista } = janelaDeAvisos()
    const antigo = [...lista.children].find(item => item.dataset.nome === nome)
    const item = criar('div', { className: 'aviso-item' })
    item.dataset.nome = nome
    const fechar = criar('button', { type: 'button', className: 'fechar', title: 'Fechar este aviso', textContent: '×' })
    const corpo = criar('div', { className: 'corpo' })
    const botao = criar('button', { type: 'button', className: 'principal', textContent: rotuloDoBotao })
    corpo.append(criar('p', { textContent: texto }), botao)
    item.append(corpo, fechar)
    if (antigo) antigo.replaceWith(item)
    else lista.append(item)
    fechar.addEventListener('click', () => {
      item.remove()
      if (!lista.children.length) hospedeiro.remove()
    })
    const mostrar = (classe, frase, ...extras) => corpo.replaceChildren(criar('p', { className: classe, textContent: frase }), ...extras)
    return { corpo, botao, mostrar, item, remover: () => fechar.click() }
  }

  // Recado para a parte de fundo, com limite de tempo (o editor pode demorar ou travar).
  // v0.26.2: "extras" vai junto no recado (ex.: o que corrigir).
  function pedirAoFundo (tipo, extras = {}) {
    const limite = new Promise(resolve => setTimeout(() => resolve({ ok: false, erro: 'O editor do SEI demorou demais para responder. Feche e abra o editor de novo.' }), 45000))
    return Promise.race([navegador.runtime.sendMessage({ ...extras, tipo }).catch(erro => ({ ok: false, erro: erro.message })), limite])
  }

  // O editor não mostra a unidade: vem do número no endereço (gravado pelas páginas do SEI) ou da janela
  // do SEI que abriu o editor (v0.22.0, em minuta-edital.js; v0.26.5 aqui, também na página do documento).
  async function unidadeAberta () {
    const sei = raiz.ExtensaoIFTO.sei
    const numero = sei.numeroDaUnidade(location.href)
    const { unidadesSei = {} } = await navegador.storage.local.get('unidadesSei')
    if (numero && unidadesSei[numero]) return unidadesSei[numero]
    for (const janela of [window.opener, window.top]) {
      try {
        const campo = janela && janela.top.document.getElementById('lnkInfraUnidade')
        if (campo) return campo.textContent.trim()
      } catch (erro) {}
    }
    return ''
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { caixaEditor: { criarCaixa, pedirAoFundo, criar, unidadeAberta } })
})(globalThis)
