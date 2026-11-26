// v0.11.0: janela da extensão no meio da página do SEI (SICAF automático): título, conteúdo e botões.
// Fica numa "shadow root" para o estilo do SEI não mudar a janela (e vice-versa).
// v0.17.3: a janela não bloqueia mais o SEI (sem fundo escuro): dá para clicar na árvore e ver a nota com ela
// aberta. Fica à direita, arrasta pelo título e o "–" a recolhe até só o título.
(function () {
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO

  const ESTILO = `
    :host { all: initial; }
    .janela { position: fixed; z-index: 2147483000; top: 70px; right: 16px; font: 14px/1.5 system-ui, sans-serif; color: #1B2420;
      background: #fff; border-radius: 12px; border: 2px solid #1E5E33; box-shadow: 0 8px 28px rgba(0,0,0,.3);
      width: min(420px, calc(100vw - 32px)); /* v0.31.1 (T186): mais estreita, para não tampar a nota */ max-height: calc(100vh - 90px); display: flex; flex-direction: column; }
    .janela.recolhida .corpo, .janela.recolhida .botoes { display: none; }
    .topo { display: flex; align-items: center; gap: 8px; padding: 12px 16px 8px; cursor: move; user-select: none; }
    .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
    h1 { font-size: 17px; font-weight: 600; margin: 0; flex: 1; }
    .fechar { border: 0; background: none; font-size: 20px; cursor: pointer; color: #5B6660; padding: 0 4px; }
    .linha { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
    button.pequeno { flex: none; min-height: 28px; padding: 0 10px; border-radius: 6px; border: 1px solid #1E5E33; background: #fff; color: #1E5E33; font: inherit; font-size: 13px; cursor: pointer; }
    /* v0.17.5: texto comprido quebra a linha; nunca barra de rolagem para o lado */
    .corpo { padding: 4px 20px 12px; overflow-y: auto; overflow-x: hidden; display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; overflow-wrap: anywhere; }
    .botoes { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; padding: 12px 20px 16px; border-top: 1px solid #E2E6E3; }
    button.acao { min-height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #D5DBD7; background: #fff; color: #1B2420; font: inherit; cursor: pointer; }
    button.acao.principal { background: #1E5E33; border-color: #1E5E33; color: #fff; }
    button.acao.perigo { background: #A3261B; border-color: #A3261B; color: #fff; }
    button.acao:disabled { opacity: .55; cursor: default; }
    p { margin: 0; }
    .apoio { color: #5B6660; font-size: 13px; }
    .cartao { border: 1px solid #E2E6E3; border-radius: 8px; padding: 10px 12px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
    /* v0.18.5: nota desmarcada (não será consultada) fica apagada */
    .cartao.desmarcada { opacity: .55; }
    /* v0.31.1 (T186): e o nome da nota riscado */
    .cartao.desmarcada h2 { text-decoration: line-through; }
    /* v0.26.10 (T76): cartão das notas compacto; o clique no cartão marca ou desmarca. */
    .cartao.compacto { padding: 5px 10px; gap: 3px; }
    .cartao.compacto h2 { font-size: 13px; flex: 1; }
    .cartao.compacto .linha { justify-content: flex-start; }
    .cartao.compacto p { margin: 0; }
    .cartao.compacto .detalhe { font-size: 12px; color: #4A5650; }
    .cartao.compacto .aviso { padding: 3px 8px; font-size: 12px; }
    .cartao.compacto label.escolha { font-size: 13px; }
    .cartao.compacto button.pequeno { min-height: 22px; padding: 0 8px; font-size: 12px; }
    /* v0.29.3 (T160): caixa de marcar maior e o CNPJ numa linha só */
    .cartao.compacto input.marcar { width: 18px; height: 18px; margin: 0; flex: none; cursor: pointer; accent-color: #1E5E33; }
    .cartao.compacto .linha.cnpj { flex-wrap: wrap; gap: 4px 10px; font-size: 13px; }
    .cartao.compacto .linha.cnpj input[type="text"] { padding: 2px 6px; font-size: 13px; width: 19ch; }
    .corpo:has(> .cartao.compacto) { gap: 5px; }
    .cartao.clicavel { cursor: pointer; }
    .cartao.clicavel:hover { background: #F4F8F5; }
    .cartao h2 { font-size: 15px; margin: 0; font-weight: 600; min-width: 0; }
    .aviso { border-radius: 8px; padding: 8px 10px; font-size: 13px; }
    .aviso.vermelho { background: #FDE7E4; color: #8A1F14; }
    .aviso.amarelo { background: #FFF1D6; color: #7A4B00; }
    .aviso.verde { background: #E7F2EA; color: #1E5E33; }
    label { display: grid; gap: 4px; font-size: 13px; }
    label.escolha { display: flex; gap: 8px; align-items: center; font-size: 14px; }
    input[type="text"], select { font: inherit; padding: 6px 8px; border: 1px solid #C9D1CC; border-radius: 6px; background: #fff; color: #1B2420; }
    /* v0.35.0: botões pequenos do fim da linha (lista para a direção) ficam juntos */
    .setas { flex: none; white-space: nowrap; }
    ul { margin: 0; padding-left: 20px; }
    a { color: #1E5E33; }
  `

  // v0.37.0 (T274, janelas-extensao-frente-barra-botoes-sei.htm): as janelas da extensão abrem no canto de
  // cima, à esquerda, da área que mostra o processo e os documentos (#divArvoreConteudoIfr, dentro do quadro
  // da direita, ifrConteudoVisualizacao), abaixo da barra de botões do SEI, para não cobrir os botões. Sem essa área: null (lugar antigo).
  function lugarDasJanelas () {
    try {
      // A área fica dentro do quadro ifrConteudoVisualizacao da página do processo.
      const quadro = document.getElementById('ifrConteudoVisualizacao')
      const area = quadro && quadro.contentDocument && quadro.contentDocument.getElementById('divArvoreConteudoIfr')
      if (!area) return null
      const fora = quadro.getBoundingClientRect()
      const dentro = area.getBoundingClientRect()
      if (!dentro.width || !dentro.height) return null
      return { top: Math.round(fora.top + dentro.top + 8), left: Math.round(fora.left + dentro.left + 8) }
    } catch (erro) {
      return null
    }
  }
  const noLugar = elemento => {
    const lugar = lugarDasJanelas()
    if (lugar) Object.assign(elemento.style, { top: lugar.top + 'px', left: lugar.left + 'px', right: 'auto' })
  }

  // abrir({ titulo, conteudo: [nós], botoes: [{ texto, tipo: 'principal'|'perigo', aoClicar(janela) }] })
  // Devolve { fechar, corpo, botoes } . Esc ou × fecham (aoFechar é chamado).
  function abrir ({ titulo, conteudo = [], botoes = [], aoFechar }) {
    const hospedeiro = document.createElement('div')
    hospedeiro.dataset.extensaoIfto = 'janela'
    const raiz = hospedeiro.attachShadow({ mode: 'open' })
    const estilo = document.createElement('style')
    estilo.textContent = ESTILO
    const janela = criar('div', { className: 'janela' })
    janela.setAttribute('role', 'dialog')
    const recolher = criar('button', { className: 'fechar', textContent: '–', title: 'Recolher ou abrir a janela' })
    const fechar = criar('button', { className: 'fechar', textContent: '×', title: 'Fechar' })
    const topo = criar('div', { className: 'topo' }, [criar('span', { className: 'marca', textContent: 'IFTO' }), criar('h1', { textContent: titulo }), recolher, fechar])
    const corpo = criar('div', { className: 'corpo' }, conteudo)
    const barraDeBotoes = criar('div', { className: 'botoes' })
    janela.append(topo, corpo, barraDeBotoes)
    raiz.append(estilo, janela)
    document.body.append(hospedeiro)

    let aberta = true
    const api = {
      corpo,
      botoes: [],
      fechar () {
        if (!aberta) return
        aberta = false
        hospedeiro.remove()
        document.removeEventListener('keydown', teclas, true)
        if (aoFechar) aoFechar()
      },
      trocarBotoes (lista) {
        barraDeBotoes.replaceChildren()
        api.botoes = lista.map(({ texto, tipo, aoClicar }) => {
          const botao = criar('button', { className: 'acao' + (tipo ? ' ' + tipo : ''), textContent: texto, type: 'button' })
          botao.addEventListener('click', () => aoClicar(api))
          barraDeBotoes.append(botao)
          return botao
        })
      },
      trocarConteudo (lista) { corpo.replaceChildren(...lista) }
    }
    // Esc só fecha quando o cursor do teclado está na janela (o SEI continua usável por trás).
    const teclas = evento => { if (evento.key === 'Escape' && evento.composedPath().includes(hospedeiro)) { evento.stopPropagation(); api.fechar() } }
    document.addEventListener('keydown', teclas, true)
    fechar.addEventListener('click', () => api.fechar())
    recolher.addEventListener('click', () => janela.classList.toggle('recolhida'))
    arrastar(janela, topo)
    noLugar(janela)
    api.trocarBotoes(botoes)
    return api
  }

  // Arrastar a janela pelo título (fica dentro da tela).
  function arrastar (janela, topo) {
    topo.addEventListener('pointerdown', evento => {
      if (evento.button !== 0 || evento.target.closest('button')) return
      const caixa = janela.getBoundingClientRect()
      const dx = evento.clientX - caixa.left
      const dy = evento.clientY - caixa.top
      const mover = movimento => {
        const esquerda = Math.min(Math.max(0, movimento.clientX - dx), window.innerWidth - 80)
        const alto = Math.min(Math.max(0, movimento.clientY - dy), window.innerHeight - 40)
        Object.assign(janela.style, { left: esquerda + 'px', top: alto + 'px', right: 'auto' })
      }
      const soltar = () => { topo.removeEventListener('pointermove', mover); topo.removeEventListener('pointerup', soltar) }
      topo.setPointerCapture(evento.pointerId)
      topo.addEventListener('pointermove', mover)
      topo.addEventListener('pointerup', soltar)
      evento.preventDefault()
    })
  }

  // criar('p', { className: 'apoio', textContent: '…' }, [filhos])
  function criar (tag, propriedades = {}, filhos = []) {
    const elemento = document.createElement(tag)
    Object.assign(elemento, propriedades)
    for (const filho of filhos) if (filho != null) elemento.append(filho)
    return elemento
  }

  // v0.36.1: mensagem rápida, que some sozinha (depois de incluir documentos, no lugar da janela com botão).
  let ultimaMensagem = null
  function mensagemRapida (texto, segundos = 6) {
    if (ultimaMensagem) ultimaMensagem.remove()
    const hospedeiro = document.createElement('div')
    ultimaMensagem = hospedeiro
    hospedeiro.dataset.extensaoIfto = 'mensagem'
    hospedeiro.setAttribute('role', 'status')
    const raiz = hospedeiro.attachShadow({ mode: 'open' })
    const caixa = criar('div', { textContent: texto })
    Object.assign(caixa.style, {
      position: 'fixed', zIndex: '2147483000', right: '16px', top: '70px', maxWidth: 'min(420px, calc(100vw - 32px))', boxSizing: 'border-box',
      padding: '10px 14px', borderRadius: '8px', border: '1px solid #B7DCC3', background: '#E7F2EA', color: '#1E5E33',
      font: '600 14px/1.4 system-ui, sans-serif', boxShadow: '0 4px 16px rgba(0,0,0,.2)', overflowWrap: 'anywhere', pointerEvents: 'none'
    })
    noLugar(caixa)
    raiz.append(caixa)
    document.body.append(hospedeiro)
    setTimeout(() => hospedeiro.remove(), segundos * 1000)
  }

  ExtensaoIFTO.janela = { abrir, criar, mensagemRapida, lugarDasJanelas }
})()
