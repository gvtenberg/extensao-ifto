// v0.13.0: aviso da extensão nas páginas do Compras.gov.br durante a busca no SICAF (posto pelo fundo).
// "login": abre o cartão "Governo" e destaca "Entrar com Gov.br" (o login é pessoal: a extensão nunca
// entra sozinha). "menu": o SICAF não abriu direto; pede para abrir pelo menu do usuário.
(function () {
  const dados = globalThis.extensaoIftoAviso || {}
  const anterior = document.querySelector('[data-extensao-ifto="aviso-compras"]')
  if (anterior) anterior.remove()

  const TEXTOS = {
    login: 'Para buscar o SICAF, entre com Gov.br no cartão "Governo" (destacado abaixo). Depois do login, a extensão abre o SICAF e continua sozinha.',
    menu: 'O SICAF não abriu direto. Abra o SICAF pelo menu do usuário (no alto, à direita) › SICAF. A extensão continua sozinha quando a página do SICAF abrir.'
  }
  const hospedeiro = document.createElement('div')
  hospedeiro.dataset.extensaoIfto = 'aviso-compras'
  const raiz = hospedeiro.attachShadow({ mode: 'open' })
  const estilo = document.createElement('style')
  estilo.textContent = `
    :host { all: initial; }
    .aviso { position: fixed; z-index: 2147483000; top: 12px; left: 50%; transform: translateX(-50%); width: min(560px, calc(100vw - 32px));
      display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 10px; background: #fff; color: #1B2420;
      border: 2px solid #1E5E33; box-shadow: 0 6px 20px rgba(0,0,0,.2); font: 14px/1.5 system-ui, sans-serif; }
    .marca { background: #1E5E33; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 4px; margin-top: 3px; }
    p { margin: 0; flex: 1; }
    button { border: 0; background: none; font-size: 18px; cursor: pointer; color: #5B6660; }
  `
  const caixa = document.createElement('div')
  caixa.className = 'aviso'
  const marca = document.createElement('span')
  marca.className = 'marca'
  marca.textContent = 'IFTO'
  const texto = document.createElement('p')
  texto.textContent = 'Extensão IFTO: ' + (TEXTOS[dados.modo] || TEXTOS.menu)
  const fechar = document.createElement('button')
  fechar.textContent = '×'
  fechar.title = 'Fechar'
  fechar.addEventListener('click', () => hospedeiro.remove())
  caixa.append(marca, texto, fechar)
  raiz.append(estilo, caixa)
  document.documentElement.append(hospedeiro)

  if (dados.modo === 'login') {
    const cartao = document.querySelector('.br-card.governo')
    if (cartao && cartao.getAttribute('expanded') !== 'on') {
      const abrir = cartao.querySelector('button.expand')
      if (abrir) abrir.click()
    }
    setTimeout(() => {
      const entrar = document.querySelector('.br-card.governo button.is-primary')
      if (!entrar) return
      entrar.style.outline = '4px solid #1E5E33'
      entrar.style.outlineOffset = '3px'
      entrar.scrollIntoView({ block: 'center' })
    }, 400)
  }
})()
