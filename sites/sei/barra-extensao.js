// v0.7.0: barra da extensão, igual em todas as unidades: no alto à direita, depois da barra de botões do
// processo. Cada função ligada (lista de assinaturas, documentos do pagamento…) põe o seu botão aqui.
(function () {
  if (window.top !== window) return
  if (!document.getElementById('lnkInfraUnidade')) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO

  const hospedeiro = document.createElement('div')
  hospedeiro.dataset.extensaoIfto = 'barra'
  const raiz = hospedeiro.attachShadow({ mode: 'open' })
  const estilo = document.createElement('style')
  estilo.textContent = `
    :host { all: initial; }
    /* v0.17.4: botões juntos numa só caixa pequena (um embaixo do outro), para não cobrir os links do SEI */
    .barra { position: fixed; z-index: 1000; display: flex; flex-direction: column; align-items: stretch;
      max-width: min(260px, calc(100vw - 24px)); font: 12px/1.3 system-ui, sans-serif;
      background: #fff; border: 1px solid #C9D1CC; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,.12); overflow: hidden; }
    .barra.vazia { display: none; }
    .marca { align-self: flex-start; background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700;
      padding: 1px 6px; border-bottom-right-radius: 4px; }
    .botoes { display: flex; flex-direction: column; }
    button { display: block; width: 100%; text-align: left; padding: 4px 8px; border: 0; border-top: 1px solid #E3E8E5;
      background: #fff; color: #1B2420; font: inherit; cursor: pointer; }
    .botoes > button:first-child { border-top: 0; }
    .botoes > button[hidden] + button:not([hidden]) { border-top: 0; }
    button:hover:not(:disabled) { background: #E7F2EA; }
    button:disabled { opacity: .6; cursor: default; }
    button[hidden] { display: none; }
  `
  const barra = document.createElement('div')
  barra.className = 'barra vazia'
  const marca = document.createElement('span')
  marca.className = 'marca'
  marca.textContent = 'IFTO'
  const lista = document.createElement('div')
  lista.className = 'botoes'
  barra.append(marca, lista)
  raiz.append(estilo, barra)
  document.body.append(hospedeiro)

  // Mesmo lugar padrão do painel da lista de assinaturas: no alto do quadro da direita.
  function posicionar () {
    const quadro = document.getElementById('divIframeVisualizacao')
    const barraDoAlto = document.getElementById('navInfraBarraNavegacao')
    let topo = 8
    if (quadro && quadro.getBoundingClientRect().height > 0) topo = quadro.getBoundingClientRect().top + 4
    else if (barraDoAlto) topo = barraDoAlto.getBoundingClientRect().bottom + 8
    Object.assign(barra.style, { top: Math.max(topo, 4) + 'px', right: '12px' })
  }

  const botoes = new Map()
  function atualizar () {
    const ordenados = [...botoes.values()].sort((a, b) => a.ordem - b.ordem)
    lista.replaceChildren(...ordenados.map(item => item.elemento))
    barra.classList.toggle('vazia', !ordenados.some(item => !item.elemento.hidden))
    posicionar()
  }

  // Cria (ou devolve) o botão de uma função. ordem: da esquerda para a direita.
  function botao (id, { texto, titulo, ordem = 50, aoClicar }) {
    if (botoes.has(id)) return botoes.get(id).elemento
    const elemento = document.createElement('button')
    elemento.type = 'button'
    elemento.title = titulo || ''
    elemento.append(' ' + texto)
    elemento.hidden = true
    elemento.addEventListener('click', aoClicar)
    botoes.set(id, { elemento, ordem })
    atualizar()
    return elemento
  }
  function mostrar (id, visivel) {
    const item = botoes.get(id)
    if (!item || item.elemento.hidden === !visivel) return
    item.elemento.hidden = !visivel
    atualizar()
  }
  // Onde termina a barra (para o painel da lista de assinaturas abrir logo abaixo dela).
  function fundo () {
    if (barra.classList.contains('vazia')) return null
    return barra.getBoundingClientRect().bottom
  }

  window.addEventListener('resize', posicionar)
  ExtensaoIFTO.barra = { botao, mostrar, fundo }
})()
