// v0.30.0: menu de cópia do ícone de cada documento na árvore do processo (T, E, L: número, nome, link do
// editor, link de acesso direto). No SEI, depois de um clique o menu fica travado por uns 2 segundos (um segundo
// clique, na opção certa, não funciona) e fecha devagar. Aqui a extensão faz a cópia: todo clique copia (o
// último vale), o menu fecha 1 segundo depois do último clique, e Esc ou um clique fora fecham na hora.
(async function () {
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  const opcoes = await globalThis.ExtensaoIFTO.configuracoes.lerConfiguracoes()
  if (!opcoes.menuCopiar) return
  const ESPERA_PARA_FECHAR = 1000
  let fechamento = null

  // Menu aberto: o SEI guarda os menus dentro de "#serialtip" e mostra só um por vez.
  function menuAberto () {
    for (const menu of document.querySelectorAll('#serialtip [data-serialtip-target]')) {
      if (getComputedStyle(menu).display !== 'none') return menu
    }
    return null
  }
  function fechar () {
    clearTimeout(fechamento)
    const menu = menuAberto()
    const botao = menu && menu.querySelector('.serialtip-close')
    if (botao) botao.click()
  }

  // Mesmo jeito do SEI: tenta a cópia direta e, se não der, a área de transferência do navegador.
  function copiar (texto) {
    let copiou = false
    const ouvir = evento => { evento.clipboardData.setData('text/plain', texto); evento.preventDefault(); copiou = true }
    document.addEventListener('copy', ouvir)
    try { document.execCommand('copy') } catch (erro) { copiou = false }
    document.removeEventListener('copy', ouvir)
    if (!copiou && navigator.clipboard) navigator.clipboard.writeText(texto).catch(() => {})
  }

  // Mesma mensagem e mesmo lugar do SEI ("Texto copiado." ao lado da opção clicada).
  function avisar (opcao) {
    const antiga = document.getElementById('divMsgClipboard')
    if (antiga) antiga.remove()
    const aviso = document.createElement('div')
    aviso.id = 'divMsgClipboard'
    aviso.className = 'msgGeral msgSucesso'
    aviso.setAttribute('role', 'alert')
    const tipo = opcao.getAttribute('tipo')
    const frases = { link: 'Link para o editor copiado.', url: 'Link para acesso direto copiado.' }
    aviso.textContent = frases[tipo] || 'Texto copiado.'
    let antes = 0
    for (let irmao = opcao.previousElementSibling; irmao; irmao = irmao.previousElementSibling) antes++
    Object.assign(aviso.style, { position: 'absolute', zIndex: 1000, top: (antes * 25) + 'px' })
    opcao.parentNode.append(aviso)
  }

  // Captura antes do "copiarParaClipboard" do SEI (que é o que trava o segundo clique).
  window.addEventListener('click', evento => {
    const opcao = evento.target.closest && evento.target.closest('#serialtip a.clipboard[data-clipboard-text]')
    if (!opcao) return
    evento.preventDefault()
    evento.stopImmediatePropagation()
    copiar(opcao.getAttribute('data-clipboard-text'))
    avisar(opcao)
    clearTimeout(fechamento)
    fechamento = setTimeout(fechar, ESPERA_PARA_FECHAR)
  }, true)

  // Esc fecha o menu na hora.
  window.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape' || !menuAberto()) return
    evento.preventDefault()
    evento.stopPropagation()
    fechar()
  }, true)

  // Clique fora do menu fecha na hora (o ícone de um documento continua abrindo e fechando o próprio menu).
  window.addEventListener('mousedown', evento => {
    if (!menuAberto() || !evento.target.closest) return
    if (evento.target.closest('#serialtip, [data-serialtip]')) return
    fechar()
  }, true)
  // Clique em outra parte do SEI (o documento à direita, o alto da página): a árvore perde o foco.
  window.addEventListener('blur', () => { if (menuAberto()) fechar() })
})()
