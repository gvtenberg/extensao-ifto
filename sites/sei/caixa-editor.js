// v0.23.0: caixa "IFTO" no canto da janela do editor do SEI e o recado para a parte de fundo, usados pela
// marca MINUTA dos editais e pela data de hoje do Ofício e da Portaria (antes ficavam só no da MINUTA).
(function (raiz) {
  const navegador = globalThis.browser || globalThis.chrome
  const ESTILO = `
    :host { all: initial; }
    .caixa { position: fixed; z-index: 100000; right: 16px; bottom: 16px; width: min(320px, calc(100vw - 32px));
      font: 13px/1.4 system-ui, sans-serif; color: #1B2420; background: #fff; border: 1px solid #C9D1CC;
      border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.18); overflow: hidden; }
    .topo { display: flex; align-items: center; justify-content: space-between; }
    .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-bottom-right-radius: 4px; }
    .fechar { border: 0; background: none; font-size: 16px; line-height: 1; padding: 2px 8px; cursor: pointer; color: #555; }
    .corpo { padding: 6px 10px 10px; }
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

  // Caixa com o texto e o botão principal. Devolve { corpo, botao, mostrar(classe, texto, ...extras) }.
  function criarCaixa (nome, texto, rotuloDoBotao) {
    const hospedeiro = criar('div')
    hospedeiro.dataset.extensaoIfto = nome
    const sombra = hospedeiro.attachShadow({ mode: 'open' })
    const fechar = criar('button', { type: 'button', className: 'fechar', title: 'Fechar este aviso', textContent: '×' })
    const topo = criar('div', { className: 'topo' })
    topo.append(criar('span', { className: 'marca', textContent: 'IFTO' }), fechar)
    const corpo = criar('div', { className: 'corpo' })
    const botao = criar('button', { type: 'button', className: 'principal', textContent: rotuloDoBotao })
    corpo.append(criar('p', { textContent: texto }), botao)
    const caixa = criar('div', { className: 'caixa' })
    caixa.append(topo, corpo)
    sombra.append(criar('style', { textContent: ESTILO }), caixa)
    document.body.append(hospedeiro)
    fechar.addEventListener('click', () => hospedeiro.remove())
    const mostrar = (classe, frase, ...extras) => corpo.replaceChildren(criar('p', { className: classe, textContent: frase }), ...extras)
    return { corpo, botao, mostrar }
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
