// v0.13.0: aviso da extensão nas páginas do Compras.gov.br durante a busca no SICAF (posto pelo fundo).
// v0.17.3 (pedido do usuário em 13/11/2026): a extensão clica sozinha em "Entrar com Gov.br" (o login no
// Gov.br continua sendo da pessoa) e, na Área de Trabalho, abre o SICAF pelo menu do usuário. Textos curtos;
// quando um passo não dá certo, o aviso diz exatamente onde clicar.
(function () {
  const dados = globalThis.extensaoIftoAviso || {}
  const anterior = document.querySelector('[data-extensao-ifto="aviso-compras"]')
  if (anterior) anterior.remove()

  const TEXTOS = {
    login: 'Entrando com Gov.br para buscar o SICAF…',
    loginManual: 'Para buscar o SICAF, clique em "Entrar com Gov.br" (destacado abaixo).',
    areaDeTrabalho: 'Abrindo o SICAF…',
    menuManual: 'Clique no seu nome (no alto, à direita) e depois em "SICAF". O resto é automático.',
    naoAbriu: 'O SICAF não abriu. Entre no Compras.gov.br com Gov.br, clique no seu nome (no alto, à direita) e depois em "SICAF". O resto é automático.'
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
  const escrever = chave => { texto.textContent = TEXTOS[chave] }
  const fechar = document.createElement('button')
  fechar.textContent = '×'
  fechar.title = 'Fechar'
  fechar.addEventListener('click', () => hospedeiro.remove())
  caixa.append(marca, texto, fechar)
  raiz.append(estilo, caixa)
  document.documentElement.append(hospedeiro)

  const esperar = ms => new Promise(pronto => setTimeout(pronto, ms))
  // Tenta várias vezes (as páginas montam os botões aos poucos).
  async function tentar (achar, vezes = 20) {
    for (let vez = 0; vez < vezes; vez++) {
      const achado = achar()
      if (achado) return achado
      await esperar(500)
    }
    return null
  }

  if (dados.modo === 'login') {
    escrever(dados.clicar ? 'login' : 'loginManual')
    // Abre o cartão "Governo" e clica (ou só destaca) "Entrar com Gov.br".
    const cartao = document.querySelector('.br-card.governo')
    if (cartao && cartao.getAttribute('expanded') !== 'on') {
      const abrir = cartao.querySelector('button.expand')
      if (abrir) abrir.click()
    }
    tentar(() => document.querySelector('.br-card.governo button.is-primary')).then(entrar => {
      if (!entrar) { escrever('loginManual'); return }
      if (dados.clicar) { entrar.click(); return }
      entrar.style.outline = '4px solid #1E5E33'
      entrar.style.outlineOffset = '3px'
      entrar.scrollIntoView({ block: 'center' })
    })
  } else if (dados.modo === 'areaDeTrabalho') {
    escrever('areaDeTrabalho')
    // A página pode avisar mais de uma vez que terminou de abrir: só uma tentativa por página.
    if (!globalThis.extensaoIftoAbrindoSicaf) {
      globalThis.extensaoIftoAbrindoSicaf = true
      abrirSicafPeloMenu().then(abriu => { if (!abriu) escrever('menuManual') })
    }
  } else {
    escrever(TEXTOS[dados.modo] ? dados.modo : 'naoAbriu')
  }

  // Menu do usuário (botão com o nome, no alto à direita) › SICAF.
  async function abrirSicafPeloMenu () {
    const ehSicaf = elemento => /\bSICAF\b/i.test(elemento.textContent || '') && (elemento.textContent || '').trim().length < 120
    const itemDoSicaf = () => [...document.querySelectorAll('.systems a, .systems button, .system, .dropdown-menu a, .dropdown-menu button')].find(ehSicaf)
    const menu = await tentar(() => document.getElementById('avatar-dropdown-trigger'))
    if (!menu) return false
    if (!itemDoSicaf()) menu.click()
    const item = await tentar(itemDoSicaf, 10)
    if (!item) return false
    const clicavel = item.closest('a, button') || item.querySelector('a, button') || item
    clicavel.click()
    return true
  }
})()
