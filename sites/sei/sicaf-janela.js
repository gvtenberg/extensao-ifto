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
      width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 90px); display: flex; flex-direction: column; }
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
    .cartao h2 { font-size: 15px; margin: 0; font-weight: 600; min-width: 0; }
    .aviso { border-radius: 8px; padding: 8px 10px; font-size: 13px; }
    .aviso.vermelho { background: #FDE7E4; color: #8A1F14; }
    .aviso.amarelo { background: #FFF1D6; color: #7A4B00; }
    .aviso.verde { background: #E7F2EA; color: #1E5E33; }
    label { display: grid; gap: 4px; font-size: 13px; }
    label.escolha { display: flex; gap: 8px; align-items: center; font-size: 14px; }
    input[type="text"] { font: inherit; padding: 6px 8px; border: 1px solid #C9D1CC; border-radius: 6px; }
    ul { margin: 0; padding-left: 20px; }
    a { color: #1E5E33; }
  `

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

  ExtensaoIFTO.janela = { abrir, criar }
})()
