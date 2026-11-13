// v0.11.0: janela da extensão no meio da página do SEI (SICAF automático): título, conteúdo e botões.
// Fica numa "shadow root" para o estilo do SEI não mudar a janela (e vice-versa).
(function () {
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO

  const ESTILO = `
    :host { all: initial; }
    .fundo { position: fixed; inset: 0; z-index: 2147483000; background: rgba(27,36,32,.35); display: flex;
      align-items: flex-start; justify-content: center; padding: 8vh 16px; font: 14px/1.5 system-ui, sans-serif; color: #1B2420; }
    .janela { background: #fff; border-radius: 12px; border: 1px solid #E2E6E3; box-shadow: 0 8px 28px rgba(0,0,0,.25);
      width: min(640px, 100%); max-height: 84vh; display: flex; flex-direction: column; }
    .topo { display: flex; align-items: center; gap: 8px; padding: 16px 20px 8px; }
    .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
    h1 { font-size: 17px; font-weight: 600; margin: 0; flex: 1; }
    .fechar { border: 0; background: none; font-size: 20px; cursor: pointer; color: #5B6660; padding: 0 4px; }
    .corpo { padding: 4px 20px 12px; overflow: auto; display: grid; gap: 10px; }
    .botoes { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; padding: 12px 20px 16px; border-top: 1px solid #E2E6E3; }
    button.acao { min-height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #D5DBD7; background: #fff; color: #1B2420; font: inherit; cursor: pointer; }
    button.acao.principal { background: #1E5E33; border-color: #1E5E33; color: #fff; }
    button.acao.perigo { background: #A3261B; border-color: #A3261B; color: #fff; }
    button.acao:disabled { opacity: .55; cursor: default; }
    p { margin: 0; }
    .apoio { color: #5B6660; font-size: 13px; }
    .cartao { border: 1px solid #E2E6E3; border-radius: 8px; padding: 10px 12px; display: grid; gap: 6px; }
    .cartao h2 { font-size: 15px; margin: 0; font-weight: 600; }
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
    const fundo = criar('div', { className: 'fundo' })
    const janela = criar('div', { className: 'janela' })
    janela.setAttribute('role', 'dialog')
    const fechar = criar('button', { className: 'fechar', textContent: '×', title: 'Fechar' })
    const topo = criar('div', { className: 'topo' }, [criar('span', { className: 'marca', textContent: 'IFTO' }), criar('h1', { textContent: titulo }), fechar])
    const corpo = criar('div', { className: 'corpo' }, conteudo)
    const barraDeBotoes = criar('div', { className: 'botoes' })
    janela.append(topo, corpo, barraDeBotoes)
    fundo.append(janela)
    raiz.append(estilo, fundo)
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
    const teclas = evento => { if (evento.key === 'Escape') { evento.stopPropagation(); api.fechar() } }
    document.addEventListener('keydown', teclas, true)
    fechar.addEventListener('click', () => api.fechar())
    api.trocarBotoes(botoes)
    return api
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
