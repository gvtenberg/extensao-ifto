// v0.26.3 (spec conferir-documento, D2/D7): janela "Assinar mesmo assim?" mostrada antes de o SEI assinar
// um documento com o número do processo errado. Usada pela árvore do processo, pelo editor e pela lista de
// assinaturas. Devolve 'assinar' ou 'nao'. Nunca assina: quem assina é o próprio SEI.
(function (raiz) {
  const ESTILO = `
    :host { all: initial; }
    .fundo { position: fixed; inset: 0; z-index: 2147483000; background: rgba(0,0,0,.35); display: flex;
      align-items: center; justify-content: center; font: 14px/1.45 system-ui, sans-serif; color: #1B2420; }
    .janela { background: #fff; border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,.3); padding: 16px 18px;
      width: min(480px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; }
    .marca { display: inline-block; background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 3px; }
    h2 { font-size: 16px; margin: 8px 0; color: #8A5A00; }
    p, ul { margin: 0 0 10px; } ul { padding-left: 18px; }
    .botoes { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    button { font: inherit; padding: 7px 14px; border-radius: 4px; cursor: pointer; border: 1px solid #C9D1CC; background: #fff; }
    .nao { background: #1E5E33; border-color: #1E5E33; color: #fff; font-weight: 600; }
  `
  const criar = (etiqueta, propriedades = {}) => Object.assign(document.createElement(etiqueta), propriedades)

  // titulo: frase do alto; linhas: lista (pode ser vazia); rotuloNao: texto do botão que não assina.
  function perguntar (titulo, linhas, rotuloNao) {
    return new Promise(resolve => {
      const hospedeiro = criar('div')
      hospedeiro.dataset.extensaoIfto = 'janela-assinar'
      const sombra = hospedeiro.attachShadow({ mode: 'open' })
      const janela = criar('div', { className: 'janela' })
      janela.setAttribute('role', 'alertdialog')
      const assinar = criar('button', { type: 'button', textContent: 'Assinar mesmo assim' })
      const nao = criar('button', { type: 'button', className: 'nao', textContent: rotuloNao })
      const botoes = criar('div', { className: 'botoes' })
      botoes.append(assinar, nao)
      janela.append(criar('span', { className: 'marca', textContent: 'IFTO' }), criar('h2', { textContent: titulo }))
      if (linhas.length) {
        const lista = criar('ul')
        for (const linha of linhas) lista.append(criar('li', { textContent: linha }))
        janela.append(lista)
      }
      janela.append(botoes)
      const fundo = criar('div', { className: 'fundo' })
      fundo.append(janela)
      sombra.append(criar('style', { textContent: ESTILO }), fundo)
      const fechar = resposta => {
        hospedeiro.remove()
        document.removeEventListener('keydown', tecla, true)
        resolve(resposta)
      }
      const tecla = evento => { if (evento.key === 'Escape') { evento.stopPropagation(); fechar('nao') } }
      document.addEventListener('keydown', tecla, true)
      assinar.addEventListener('click', () => fechar('assinar'))
      nao.addEventListener('click', () => fechar('nao'))
      ;(document.body || document.documentElement).append(hospedeiro)
      nao.focus()
    })
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { janelaAssinar: { perguntar } })
})(globalThis)
