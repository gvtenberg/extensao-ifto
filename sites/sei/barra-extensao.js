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
    .barra { position: fixed; z-index: 1000; display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;
      max-width: calc(100vw - 24px); font: 13px/1.4 system-ui, sans-serif; }
    .barra:empty, .barra.vazia { display: none; }
    button { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 6px;
      border: 1px solid #C9D1CC; background: #fff; color: #1B2420; font: inherit; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,.12); }
    button:hover:not(:disabled) { background: #E7F2EA; }
    button:disabled { opacity: .6; cursor: default; }
    button[hidden] { display: none; }
    .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
  `
  const barra = document.createElement('div')
  barra.className = 'barra vazia'
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
    barra.replaceChildren(...ordenados.map(item => item.elemento))
    barra.classList.toggle('vazia', !ordenados.some(item => !item.elemento.hidden))
    posicionar()
  }

  // Cria (ou devolve) o botão de uma função. ordem: da esquerda para a direita.
  function botao (id, { texto, titulo, ordem = 50, aoClicar }) {
    if (botoes.has(id)) return botoes.get(id).elemento
    const elemento = document.createElement('button')
    elemento.type = 'button'
    elemento.title = titulo || ''
    const marca = document.createElement('span')
    marca.className = 'marca'
    marca.textContent = 'IFTO'
    elemento.append(marca, ' ' + texto)
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
