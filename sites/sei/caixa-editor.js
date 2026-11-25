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
    .topo { touch-action: none; display: flex; align-items: center; justify-content: space-between; cursor: move; user-select: none;
      background: #F1F4F2; border-bottom: 1px solid #C9D1CC; }
    .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-bottom-right-radius: 4px; }
    .titulo { flex: 1; padding: 0 8px; font-size: 12px; color: #555; }
    .fechar { border: 0; background: none; font-size: 16px; line-height: 1; padding: 2px 8px; cursor: pointer; color: #555; }
    .reabrir { border: 0; background: none; padding: 2px 4px; font-size: 12px; color: #1E5E33; text-decoration: underline; cursor: pointer; }
    /* v0.36.2: a janela fechada vira este ícone, no mesmo lugar. */
    .icone { position: fixed; z-index: 100000; right: 16px; bottom: 16px; display: flex; align-items: center; gap: 5px;
      padding: 5px 7px; border: 1px solid #fff; border-radius: 6px; background: #1E5E33; color: #fff; cursor: pointer;
      font: 700 11px/1.4 system-ui, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,.3); user-select: none; touch-action: none; }
    .icone button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
    .icone .abrir { display: flex; align-items: center; gap: 5px; padding: 0; border: 0; background: none; color: inherit; font: inherit; cursor: pointer; }
    .icone .fechar { padding: 0 2px; font-size: 13px; color: #fff; }
    .numero { min-width: 16px; padding: 0 4px; border-radius: 8px; background: #fff; color: #1E5E33; text-align: center; box-sizing: border-box; }
    [hidden] { display: none !important; }
    @media print { :host { display: none !important; } }
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
    /* v0.31.0 (spec copia-editor-sei): botões a mais no mesmo aviso. */
    .secundario { width: 100%; margin-top: 6px; padding: 5px 10px; border: 1px solid #1E5E33; border-radius: 4px;
      background: #fff; color: #1E5E33; font: inherit; cursor: pointer; }
    .secundario:disabled { opacity: .6; cursor: default; }
  `
  const criar = (etiqueta, propriedades = {}) => Object.assign(document.createElement(etiqueta), propriedades)

  // Põe um elemento fixo num lugar da tela, sem deixar sair dela.
  function posicionar (elemento, x, y) {
    const esquerda = Math.max(0, Math.min(x, window.innerWidth - elemento.offsetWidth))
    const alto = Math.max(0, Math.min(y, window.innerHeight - elemento.offsetHeight))
    Object.assign(elemento.style, { left: esquerda + 'px', top: alto + 'px', right: 'auto', bottom: 'auto' })
  }
  // Põe um elemento com o canto inferior direito no mesmo lugar do outro (a janela que vira ícone e vice-versa).
  const alinhar = (elemento, lugar) => posicionar(elemento, lugar.right - elemento.offsetWidth, lugar.bottom - elemento.offsetHeight)

  let janela = null
  // A janela única (criada no primeiro aviso). v0.36.2 (pedido do usuário, 25/11/2026): fechada, vira um ícone
  // no mesmo lugar, com o número do que há a corrigir (sem número quando só há avisos como o "Desfazer" do espaço);
  // o clique abre de novo, dá para arrastar, e o × do ícone o tira da tela sem abrir a janela.
  function janelaDeAvisos () {
    if (janela && janela.hospedeiro.isConnected) return janela
    const hospedeiro = criar('div')
    hospedeiro.dataset.extensaoIfto = 'avisos'
    const sombra = hospedeiro.attachShadow({ mode: 'open' })
    const fechar = criar('button', { type: 'button', className: 'fechar', title: 'Fechar todos os avisos (fica um ícone para abrir de novo)', textContent: '×' })
    const reabrir = criar('button', { type: 'button', className: 'reabrir', hidden: true })
    const topo = criar('div', { className: 'topo', title: 'Arraste para mudar a janela de lugar' })
    topo.append(criar('span', { className: 'marca', textContent: 'IFTO' }), criar('span', { className: 'titulo', textContent: 'Avisos da extensão' }), reabrir, fechar)
    const lista = criar('div', { className: 'lista' })
    const caixa = criar('div', { className: 'caixa' })
    caixa.append(topo, lista)
    const icone = criar('div', { className: 'icone', hidden: true })
    const abrir = criar('button', { type: 'button', className: 'abrir' })
    const dispensar = criar('button', { type: 'button', className: 'fechar', title: 'Fechar o ícone (volta ao abrir o documento de novo)', textContent: '×' })
    icone.append(abrir, dispensar)
    sombra.append(criar('style', { textContent: ESTILO }), caixa, icone)
    document.body.append(hospedeiro)
    const estado = { hospedeiro, lista, caixa, icone, abrir, reabrir, movida: false, dispensada: false }
    janela = estado
    fechar.addEventListener('click', fecharAvisos)
    reabrir.addEventListener('click', mostrarFechados)
    arrastar(topo, caixa, () => { estado.movida = true })
    const arrastou = arrastar(icone, icone, () => { estado.movida = true })
    // Depois de arrastar, o navegador também manda um clique: esse não abre a janela.
    icone.addEventListener('click', evento => { if (!arrastou() && !evento.target.closest('.fechar')) mostrarFechados() })
    dispensar.addEventListener('click', () => { estado.dispensada = true; atualizarJanela() })
    // Tela diminuída: a janela ou o ícone que a pessoa moveu continua dentro dela.
    window.addEventListener('resize', () => {
      const visivel = caixa.hidden ? icone : caixa
      if (!estado.movida || estado.dispensada || visivel.hidden || !hospedeiro.isConnected) return
      const lugar = visivel.getBoundingClientRect()
      posicionar(visivel, lugar.left, lugar.top)
    })
    return janela
  }

  // Mostra a janela (há aviso aberto), o ícone (só há avisos fechados) ou nada (não sobrou aviso).
  function atualizarJanela () {
    const { hospedeiro, lista, caixa, icone, abrir, reabrir, movida } = janela
    const itens = [...lista.children]
    if (!itens.length) { hospedeiro.remove(); return }
    const fechados = itens.filter(item => item.hidden).length
    const aberta = fechados < itens.length
    reabrir.hidden = !fechados
    reabrir.textContent = `Mostrar ${fechados} ${fechados === 1 ? 'fechado' : 'fechados'}`
    if (!aberta) {
      const numero = itens.filter(item => !item.dataset.resolvido).length
      abrir.replaceChildren(criar('span', { textContent: 'IFTO' }), ...(numero ? [criar('span', { className: 'numero', textContent: String(numero) })] : []))
      abrir.title = 'Avisos da extensão: clique para abrir, arraste para mudar de lugar'
    }
    if (aberta) janela.dispensada = false
    hospedeiro.style.setProperty('display', janela.dispensada ? 'none' : '', janela.dispensada ? 'important' : '')
    if (aberta === !caixa.hidden) return
    const lugar = (aberta ? icone : caixa).getBoundingClientRect()
    caixa.hidden = !aberta
    icone.hidden = aberta
    if (movida) alinhar(aberta ? caixa : icone, lugar)
  }

  // O aviso só de passagem some ao fechar; os outros ficam guardados no ícone.
  function fecharItem (item) {
    if (item.dataset.passageiro) item.remove()
    else item.hidden = true
  }
  // Fecha todos os avisos desta página (ficam no ícone).
  function fecharAvisos () {
    if (!janela || !janela.hospedeiro.isConnected) return
    for (const item of [...janela.lista.children]) fecharItem(item)
    atualizarJanela()
  }
  function mostrarFechados () {
    for (const item of janela.lista.children) item.hidden = false
    atualizarJanela()
  }

  // Arrastar com o mouse ou o dedo, sem deixar sair da tela. Devolve uma função: o último gesto arrastou?
  function arrastar (alca, alvo, aoMover) {
    let moveu = false
    alca.addEventListener('pointerdown', evento => {
      if (evento.button !== 0 || (alca !== alvo && evento.target.closest('button')) || evento.target.closest('.fechar')) return
      moveu = false
      const inicio = alvo.getBoundingClientRect()
      const dx = evento.clientX - inicio.left
      const dy = evento.clientY - inicio.top
      alca.setPointerCapture(evento.pointerId)
      const mover = e => {
        // Um tremor do mouse no clique não conta como arrastar.
        if (!moveu && Math.hypot(e.clientX - evento.clientX, e.clientY - evento.clientY) < 5) return
        moveu = true
        posicionar(alvo, e.clientX - dx, e.clientY - dy)
        aoMover()
      }
      const soltar = () => {
        alca.removeEventListener('pointermove', mover)
        alca.removeEventListener('pointerup', soltar)
        alca.removeEventListener('pointercancel', soltar)
      }
      alca.addEventListener('pointermove', mover)
      alca.addEventListener('pointerup', soltar)
      alca.addEventListener('pointercancel', soltar)
      evento.preventDefault()
    })
    // Aberto pelo teclado depois de ter sido arrastado: o clique vale.
    alca.addEventListener('keydown', () => { moveu = false })
    return () => moveu
  }

  // Um aviso dentro da janela única, com o texto e o botão principal. Devolve { corpo, botao, mostrar(classe, texto, ...extras), resolver() }.
  // Chamado de novo com o mesmo nome, troca o aviso antigo. "passageiro": some ao fechar, não vai para o ícone.
  function criarCaixa (nome, texto, rotuloDoBotao, { passageiro = false } = {}) {
    const { lista } = janelaDeAvisos()
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
    // Resolvido (ou só informação): continua na janela e no ícone, mas não conta no número.
    if (passageiro) item.dataset.passageiro = '1'
    const resolver = (sim = true) => { if (sim) item.dataset.resolvido = '1'; else delete item.dataset.resolvido }
    resolver(false)
    fechar.addEventListener('click', () => { fecharItem(item); atualizarJanela() })
    const mostrar = (classe, frase, ...extras) => {
      corpo.replaceChildren(criar('p', { className: classe, textContent: frase }), ...extras)
      resolver(classe === 'ok')
      // A resposta de um clique aparece mesmo se a janela foi fechada enquanto isso.
      if (item.isConnected && item.hidden) { item.hidden = false; atualizarJanela() }
    }
    const remover = () => { if (item.isConnected) { item.remove(); atualizarJanela() } }
    atualizarJanela()
    return { corpo, botao, mostrar, resolver, item, remover }
  }

  // v0.36.2: tira um aviso pelo nome (a conferência de novo no editor aberto).
  function tirarAviso (nome) {
    if (!janela || !janela.hospedeiro.isConnected) return
    const item = [...janela.lista.children].find(outro => outro.dataset.nome === nome)
    if (item) { item.remove(); atualizarJanela() }
  }

  // v0.36.2 (pedido do usuário, 25/11/2026): "Abrir o editor para corrigir" com o editor já aberto: o SEI só traz
  // a janela para a frente e nada era conferido de novo. O recado vem pela parte de fundo (a todas as páginas do
  // SEI); só o editor deste documento confere. Cada conferência devolve true (há aviso), false ou null (falhou).
  const conferencias = []
  const quandoConferirDeNovo = conferir => conferencias.push(conferir)
  let conferindo = false
  async function conferirDeNovo () {
    if (conferindo) return
    conferindo = true
    try {
      tirarAviso('conferido')
      const respostas = await Promise.all(conferencias.map(conferir => Promise.resolve().then(conferir).catch(() => null)))
      if (janela && janela.hospedeiro.isConnected) mostrarFechados()
      if (respostas.includes(true)) return
      const caixa = criarCaixa('conferido', '', '', { passageiro: true })
      if (respostas.includes(null)) caixa.mostrar('erro', 'Não consegui conferir o texto aberto no editor. Feche o editor e abra de novo.')
      else caixa.mostrar('ok', 'Nada a corrigir no texto aberto neste editor. Se você já corrigiu, clique em Salvar: só depois disso o documento muda.')
    } finally {
      conferindo = false
    }
  }
  if (window.top === window && /[?&]acao=editor_montar/.test(location.href)) {
    navegador.runtime.onMessage.addListener(recado => {
      if (!recado || recado.tipo !== 'editorConferirDeNovo' || !recado.documento) return
      // Nome que o SEI dá à janela do editor: "janelaEditor_<usuário>_<documento>".
      const doNome = (/^janelaEditor_\d+_(\d+)$/.exec(window.name) || [])[1]
      const documento = doNome || new URL(location.href).searchParams.get('id_documento')
      if (documento === recado.documento) conferirDeNovo()
    })
  }

  // Recado para a parte de fundo, com limite de tempo (o editor pode demorar ou travar).
  // v0.26.2: "extras" vai junto no recado (ex.: o que corrigir).
  function pedirAoFundo (tipo, extras = {}) {
    const limite = new Promise(resolve => setTimeout(() => resolve({ ok: false, erro: 'O editor do SEI demorou demais para responder. Feche e abra o editor de novo.' }), 45000))
    // v0.31.3 (T195): "Could not establish connection" = a parte de fundo da extensão não estava pronta (ou a
    // extensão foi atualizada com o editor aberto): tenta de novo uma vez e, se falhar, explica em palavras simples.
    const semConexao = erro => /establish connection|Receiving end|context invalidated/i.test(erro.message || '')
    const enviar = () => navegador.runtime.sendMessage({ ...extras, tipo })
    const pedido = enviar().catch(erro => {
      if (!semConexao(erro)) return { ok: false, erro: erro.message }
      return new Promise(resolve => setTimeout(resolve, 1500)).then(enviar).catch(e => ({
        ok: false,
        erro: semConexao(e) ? 'a extensão foi atualizada ou reiniciada com o editor aberto. Feche esta janela do editor e abra de novo.' : e.message
      }))
    })
    return Promise.race([pedido, limite])
  }

  // v0.35.2: a leitura da unidade fica em comum/sei.js.
  const unidadeAberta = () => raiz.ExtensaoIFTO.sei.unidadeAberta()

  // v0.31.1: as ajudas que se ligam ao editor (tabelas, números longos, ★) entram nesta lista. Quando o editor é
  // montado de novo (restaurar ou colar uma versão salva), todas se ligam de novo, sem uma lista à parte para cada ajuda.
  const aoRemontar = []
  const quandoRemontar = preparar => aoRemontar.push(preparar)
  const editorRemontado = () => Promise.all(aoRemontar.map(preparar => Promise.resolve().then(preparar).catch(() => {})))

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { caixaEditor: { criarCaixa, fecharAvisos, tirarAviso, quandoConferirDeNovo, pedirAoFundo, criar, unidadeAberta, quandoRemontar, editorRemontado } })
})(globalThis)
