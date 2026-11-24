// v0.36.0: opções da extensão no menu do ícone do documento na árvore (saiu de lista-direcao.js, para servir
// também a "Duplicar documento"). Cada função registra { nome, primeira, ligada(), opcoes(lida, documento) },
// e opcoes devolve [{ texto, aoClicar }]. Só na página principal do SEI.
(function () {
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const funcoes = []

  // Documentos de pastas fechadas não vêm com a árvore: lê a árvore com todas as pastas abertas (só leitura).
  async function arvoreCompleta (lida) {
    if (!lida.linkAbrirPastas) return lida
    const { html } = await ExtensaoIFTO.seiPedidos.pedir(lida.linkAbrirPastas)
    const completa = ExtensaoIFTO.sei.lerArvore(html)
    if (completa.idProcesso !== lida.idProcesso) return lida
    return { ...lida, documentos: completa.documentos }
  }
  async function acharDocumento (id) {
    let lida = ExtensaoIFTO.seiPedidos.arvoreAberta()
    if (!lida) return null
    let documento = lida.documentos.find(doc => doc.id === id)
    if (!documento) {
      lida = await arvoreCompleta(lida)
      documento = lida.documentos.find(doc => doc.id === id)
    }
    return documento ? { lida, documento } : null
  }

  function opcaoDoMenu ({ texto, aoClicar }, nome, documentoDaArvore, menu) {
    const opcao = documentoDaArvore.createElement('a')
    opcao.href = '#'
    opcao.className = 'list-group-item d-flex flex-row clipboard-icon-focus'
    opcao.dataset.extensaoIfto = nome
    const marca = documentoDaArvore.createElement('span')
    marca.textContent = 'IFTO'
    marca.style.cssText = 'background:#1E5E33;color:#fff;font-size:9px;font-weight:700;padding:1px 3px;border-radius:3px;margin-right:4px;align-self:center'
    const rotulo = documentoDaArvore.createElement('span')
    rotulo.className = 'align-self-center'
    rotulo.textContent = texto
    opcao.append(marca, rotulo)
    opcao.addEventListener('click', evento => {
      evento.preventDefault()
      const fechar = menu.querySelector('.serialtip-close')
      if (fechar) fechar.click()
      aoClicar()
    })
    return opcao
  }
  async function porOpcoes (menu, documentoDaArvore) {
    const grupo = menu.querySelector('.list-group[tipo="DOCUMENTO"]')
    const achado = /anchorImg(\d+)$/.exec(menu.getAttribute('data-serialtip-target') || '')
    if (!grupo || !achado) return
    // Cada função entra uma vez em cada menu (uma ligada depois entra na próxima vez que o menu abrir).
    const postas = new Set((menu.dataset.extensaoIftoMenu || '').split(' ').filter(Boolean))
    const novas = funcoes.filter(funcao => funcao.ligada() && !postas.has(funcao.nome))
    if (!novas.length) return
    const marcar = () => { menu.dataset.extensaoIftoMenu = [...postas].join(' ') }
    for (const funcao of novas) postas.add(funcao.nome)
    marcar()
    let encontrado = null
    try { encontrado = await acharDocumento(achado[1]) } catch (erro) {}
    // Não deu para ler agora (SEI lento): tenta de novo na próxima vez que o menu abrir.
    if (!encontrado) {
      const agora = new Set((menu.dataset.extensaoIftoMenu || '').split(' ').filter(Boolean))
      for (const funcao of novas) agora.delete(funcao.nome)
      menu.dataset.extensaoIftoMenu = [...agora].join(' ')
      return
    }
    for (const funcao of novas) {
      const antes = (funcao.primeira && grupo.querySelector('a[data-extensao-ifto]')) || grupo.querySelector('.li-fechar')
      for (const opcao of funcao.opcoes(encontrado.lida, encontrado.documento)) grupo.insertBefore(opcaoDoMenu(opcao, funcao.nome, documentoDaArvore, menu), antes)
    }
  }

  let vigiando = false
  function registrar (funcao) {
    funcoes.push(funcao)
    const quadro = document.getElementById('ifrArvore')
    if (!quadro || vigiando) return
    vigiando = true
    const preparar = () => {
      let arvore = null
      try { arvore = quadro.contentDocument } catch (erro) {}
      if (!arvore || !arvore.documentElement || arvore.documentElement.dataset.extensaoIftoMenu) return
      arvore.documentElement.dataset.extensaoIftoMenu = '1'
      // O menu só é montado quando a pessoa clica no ícone (também nos documentos de pastas abertas depois).
      const aoChegar = evento => {
        const icone = evento.target.closest && evento.target.closest('[data-serialtip]')
        if (!icone || !funcoes.some(funcao => funcao.ligada())) return
        const alvo = icone.getAttribute('data-serialtip')
        const menu = [...arvore.querySelectorAll('[data-serialtip-target]')].find(m => m.getAttribute('data-serialtip-target') === alvo)
        if (menu) porOpcoes(menu, arvore)
      }
      arvore.addEventListener('mousedown', aoChegar, true)
      arvore.addEventListener('click', aoChegar, true)
    }
    quadro.addEventListener('load', preparar)
    preparar()
  }

  ExtensaoIFTO.menuDocumento = { registrar, arvoreCompleta }
})()
