// v0.2.0: lista de assinaturas no SEI (spec lista-assinaturas). Painel flutuante na página principal do SEI:
// colar a lista, abrir os itens um a um pela pesquisa rápida e mostrar "8/28". A lista fica no navegador
// (storage.local, chave listaAssinaturas) até o usuário limpar; nada vai para a internet.
(async function () {
  if (window.top !== window) return
  const { listaAssinaturas: regras, configuracoes } = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  const CHAVE = 'listaAssinaturas'

  // Só nas páginas completas do SEI (com a unidade no alto); janelinhas e telas de entrada ficam de fora.
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  if (!campoUnidade) return
  const unidade = campoUnidade.textContent.trim()

  let opcoes = await configuracoes.lerConfiguracoes()
  let estado = await lerEstado()
  // O que não é guardado: o modo do painel (com lista, sempre "navegar"), o rascunho e as linhas erradas.
  let modo = estado ? 'navegar' : 'fechado'
  let rascunho = ''
  let erros = []
  let aviso = ''

  async function lerEstado () {
    const { [CHAVE]: gravado } = await navegador.storage.local.get(CHAVE)
    if (!gravado || !Array.isArray(gravado.itens) || !gravado.itens.length) return null
    gravado.posicao = regras.limitarPosicao(gravado.posicao, gravado.itens.length)
    return gravado
  }
  async function gravarEstado () {
    if (estado) await navegador.storage.local.set({ [CHAVE]: estado })
    else await navegador.storage.local.remove(CHAVE)
  }

  // Painel isolado do estilo do SEI (shadow DOM).
  const hospedeiro = document.createElement('div')
  hospedeiro.dataset.extensaoIfto = 'lista-assinaturas'
  const raiz = hospedeiro.attachShadow({ mode: 'open' })
  const estilo = document.createElement('style')
  estilo.textContent = CSS()
  const painel = document.createElement('div')
  painel.className = 'painel'
  raiz.append(estilo, painel)
  document.body.append(hospedeiro)

  // ---------- Posição: padrão à direita da barra de botões do processo; arrastável ----------
  function posicaoPadrao () {
    const quadro = document.getElementById('divIframeVisualizacao')
    const barraDoAlto = document.getElementById('navInfraBarraNavegacao')
    let topo = 8
    if (quadro && quadro.getBoundingClientRect().height > 0) topo = quadro.getBoundingClientRect().top + 4
    else if (barraDoAlto) topo = barraDoAlto.getBoundingClientRect().bottom + 8
    return { top: Math.max(topo, 4), right: 12 }
  }
  function posicionar () {
    const guardada = estado && estado.painel
    if (guardada) {
      const largura = painel.offsetWidth || 300
      const altura = painel.offsetHeight || 40
      const left = Math.min(Math.max(guardada.left, 0), Math.max(window.innerWidth - largura, 0))
      const top = Math.min(Math.max(guardada.top, 0), Math.max(window.innerHeight - altura, 0))
      Object.assign(painel.style, { left: left + 'px', top: top + 'px', right: 'auto' })
    } else {
      const { top, right } = posicaoPadrao()
      Object.assign(painel.style, { top: top + 'px', right: right + 'px', left: 'auto' })
    }
  }
  function permitirArrastar (alca) {
    alca.addEventListener('pointerdown', inicio => {
      if (inicio.button !== 0 || inicio.target.closest('button')) return
      const caixa = painel.getBoundingClientRect()
      const dx = inicio.clientX - caixa.left
      const dy = inicio.clientY - caixa.top
      alca.setPointerCapture(inicio.pointerId)
      const mover = evento => {
        Object.assign(painel.style, {
          left: Math.max(evento.clientX - dx, 0) + 'px', top: Math.max(evento.clientY - dy, 0) + 'px', right: 'auto'
        })
      }
      const soltar = () => {
        alca.removeEventListener('pointermove', mover)
        alca.removeEventListener('pointerup', soltar)
        const nova = painel.getBoundingClientRect()
        if (estado && (Math.abs(nova.left - caixa.left) > 2 || Math.abs(nova.top - caixa.top) > 2)) {
          estado.painel = { left: Math.round(nova.left), top: Math.round(nova.top) }
          gravarEstado()
        }
      }
      alca.addEventListener('pointermove', mover)
      alca.addEventListener('pointerup', soltar)
    })
  }
  window.addEventListener('resize', () => posicionar())

  // ---------- Abrir o item pela pesquisa rápida do SEI ----------
  function abrirItem () {
    const item = estado.itens[estado.posicao]
    const formulario = document.getElementById('frmProtocoloPesquisaRapida')
    const campo = document.getElementById('txtPesquisaRapida')
    if (!formulario || !campo) {
      aviso = 'Não achei a pesquisa rápida do SEI nesta página. Abra a tela inicial do SEI e tente de novo.'
      desenhar()
      return
    }
    campo.value = regras.textoDaPesquisa(item)
    formulario.submit()
  }
  async function irPara (posicao) {
    estado.posicao = regras.limitarPosicao(posicao, estado.itens.length)
    aviso = ''
    await gravarEstado()
    desenhar()
    abrirItem()
  }

  // ---------- Desenho ----------
  function el (tag, atributos = {}, ...filhos) {
    const elemento = document.createElement(tag)
    for (const [chave, valor] of Object.entries(atributos)) {
      if (chave.startsWith('on')) elemento.addEventListener(chave.slice(2), valor)
      else if (valor !== false && valor != null) elemento.setAttribute(chave, valor === true ? '' : valor)
    }
    elemento.append(...filhos.flat().filter(filho => filho != null && filho !== false))
    return elemento
  }

  function cabecalho (titulo, ...botoes) {
    const topo = el('div', { class: 'cabecalho', title: 'Arraste para mover' },
      el('span', { class: 'marca', title: 'Extensão IFTO Palmas' }, 'IFTO'),
      el('strong', {}, titulo),
      el('span', { class: 'espaco' }),
      ...botoes)
    permitirArrastar(topo)
    return topo
  }

  function desenharFechado () {
    painel.className = 'painel fechado'
    const botao = el('button', { class: 'abrir', type: 'button', title: 'Colar uma lista de processos e documentos para assinar', onclick: () => { modo = 'colar'; desenhar() } },
      el('span', { class: 'marca' }, 'IFTO'), ' Lista de assinaturas')
    painel.replaceChildren(botao)
  }

  function desenharColar () {
    painel.className = 'painel'
    const caixa = el('textarea', {
      rows: 8,
      placeholder: 'Uma linha por item. Exemplos:\n23236.021417/2026-95 - 3383423 dar ciência\n23236.011766/2026-07\n3383812',
      oninput: () => { rascunho = caixa.value }
    })
    caixa.value = rascunho
    const corpo = [
      el('p', { class: 'apoio' }, 'Cole o número do processo e, se houver, o número SEI do documento e um comentário. A lista fica guardada só neste navegador.'),
      caixa
    ]
    if (erros.length) {
      const boas = regras.lerLista(rascunho).itens.length
      corpo.push(el('div', { class: 'erros' },
        el('strong', {}, `${erros.length} ${erros.length === 1 ? 'linha não reconhecida' : 'linhas não reconhecidas'}:`),
        el('ul', {}, erros.map(erro => el('li', {}, `Linha ${erro.numero}: ${erro.texto}`))),
        el('span', {}, 'Corrija acima e clique em Conferir, ou comece só com as reconhecidas.')))
      if (boas) corpo.push(el('button', { type: 'button', class: 'botao', onclick: () => comecar(true) }, `Começar só com as ${boas} reconhecidas`))
    }
    corpo.push(el('div', { class: 'acoes' },
      el('button', { type: 'button', class: 'botao', onclick: () => { modo = estado ? 'navegar' : 'fechado'; erros = []; desenhar() } }, 'Cancelar'),
      el('button', { type: 'button', class: 'botao principal', onclick: () => comecar(false) }, 'Conferir e começar')))
    painel.replaceChildren(cabecalho('Colar lista'), el('div', { class: 'corpo' }, corpo))
    caixa.focus()
  }

  async function comecar (ignorarErros) {
    const lida = regras.lerLista(rascunho)
    erros = lida.erros
    if (!lida.itens.length) {
      erros = lida.erros.length ? lida.erros : [{ numero: 1, texto: '(nenhuma linha)' }]
      desenhar()
      return
    }
    if (erros.length && !ignorarErros) { desenhar(); return }
    estado = { itens: lida.itens, posicao: 0, painel: estado ? estado.painel : null }
    modo = 'navegar'
    erros = []
    rascunho = ''
    await irPara(0)
  }

  function desenharNavegar () {
    painel.className = 'painel'
    const item = estado.itens[estado.posicao]
    const total = estado.itens.length
    const contador = el('span', { class: 'contador' }, `${estado.posicao + 1}/${total}`)
    const corpo = [
      el('div', { class: 'item' },
        item.processo ? el('div', {}, el('span', { class: 'rotulo' }, 'Processo '), el('strong', {}, item.processo)) : null,
        item.documento
          ? el('div', {}, el('span', { class: 'rotulo' }, 'Documento '), el('strong', {}, item.documento))
          : el('div', { class: 'apoio' }, 'Sem documento: abre o processo.'),
        item.comentario ? el('div', { class: 'comentario' }, item.comentario) : null),
      aviso ? el('div', { class: 'erros' }, aviso) : null,
      el('div', { class: 'acoes' },
        el('button', { type: 'button', class: 'botao', disabled: estado.posicao === 0, onclick: () => irPara(estado.posicao - 1) }, '◀ Anterior'),
        el('button', { type: 'button', class: 'botao principal', disabled: estado.posicao === total - 1, onclick: () => irPara(estado.posicao + 1) }, 'Próximo ▶')),
      el('div', { class: 'links' },
        el('button', { type: 'button', class: 'link', onclick: () => irPara(estado.posicao) }, 'Abrir de novo'),
        el('button', { type: 'button', class: 'link', onclick: voltarAoLugarPadrao }, 'Lugar padrão'),
        el('button', { type: 'button', class: 'link perigo', onclick: limpar }, 'Limpar lista'))
    ]
    painel.replaceChildren(cabecalho('Lista de assinaturas', contador), el('div', { class: 'corpo' }, corpo))
  }

  async function voltarAoLugarPadrao () {
    estado.painel = null
    await gravarEstado()
    posicionar()
  }

  async function limpar () {
    if (!window.confirm('Apagar a lista de assinaturas deste navegador?')) return
    estado = null
    modo = 'fechado'
    await gravarEstado()
    desenhar()
  }

  function desenhar () {
    const ligada = regras.funcaoLigada(opcoes.listaAssinaturas, unidade)
    hospedeiro.style.display = ligada ? '' : 'none'
    if (!ligada) return
    if (modo === 'navegar' && !estado) modo = 'fechado'
    if (modo === 'fechado') desenharFechado()
    else if (modo === 'colar') desenharColar()
    else desenharNavegar()
    posicionar()
  }

  // Outra aba mudou a lista ou as configurações: acompanha.
  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local') return
    if (mudancas.configuracoes) opcoes = await configuracoes.lerConfiguracoes()
    if (mudancas[CHAVE]) {
      estado = await lerEstado()
      if (modo !== 'colar') modo = estado ? 'navegar' : 'fechado'
    }
    if (mudancas.configuracoes || mudancas[CHAVE]) desenhar()
  })

  desenhar()

  function CSS () {
    return `
      :host { all: initial; }
      .painel { position: fixed; z-index: 1000; width: 300px; max-width: calc(100vw - 16px);
        background: #fff; color: #1B2420; border: 1px solid #C9D1CC; border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,.18); font: 13px/1.4 system-ui, sans-serif; }
      .painel.fechado { width: auto; border: 0; background: transparent; box-shadow: none; }
      .abrir { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 6px;
        border: 1px solid #C9D1CC; background: #fff; color: #1B2420; font: inherit; cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,.12); }
      .abrir:hover { background: #E7F2EA; }
      .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
      .cabecalho { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: #F5F6F4;
        border-bottom: 1px solid #E2E6E3; border-radius: 8px 8px 0 0; cursor: move; user-select: none; }
      .espaco { flex: 1; }
      .contador { font-weight: 700; font-size: 14px; }
      .corpo { padding: 8px 10px 10px; display: grid; gap: 8px; }
      .apoio { color: #5B6660; font-size: 12px; margin: 0; }
      .rotulo { color: #5B6660; }
      .item { display: grid; gap: 2px; }
      .comentario { margin-top: 4px; padding: 4px 6px; background: #FFF1D6; color: #7A4B00; border-radius: 4px; font-weight: 600; }
      textarea { width: 100%; box-sizing: border-box; font: 12px/1.4 ui-monospace, monospace; padding: 6px;
        border: 1px solid #C9D1CC; border-radius: 6px; resize: vertical; }
      .erros { background: #FDECEC; color: #9B1C1C; border-radius: 6px; padding: 6px 8px; font-size: 12px; }
      .erros ul { margin: 4px 0; padding-left: 18px; max-height: 120px; overflow: auto; }
      .acoes { display: flex; gap: 6px; }
      .acoes .botao { flex: 1; }
      .botao { min-height: 32px; padding: 0 10px; border-radius: 6px; border: 1px solid #C9D1CC;
        background: #fff; color: #1B2420; font: inherit; cursor: pointer; }
      .botao:hover:not(:disabled) { background: #F5F6F4; }
      .botao.principal { background: #1E5E33; border-color: #1E5E33; color: #fff; font-weight: 600; }
      .botao.principal:hover:not(:disabled) { background: #174A28; }
      .botao:disabled { opacity: .45; cursor: default; }
      .links { display: flex; flex-wrap: wrap; gap: 4px 12px; }
      .link { border: 0; background: none; padding: 0; color: #1E5E33; font: inherit; font-size: 12px;
        text-decoration: underline; cursor: pointer; }
      .link.perigo { color: #9B1C1C; }
    `
  }
})()
