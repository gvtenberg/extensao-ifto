// Botão "Novo documento" sempre visível na barra de ações (portado do SEI++, novoDocumento.js).
// O SEI antigo esconde o botão em alguns casos, mas o link continua no script da árvore (frame ifrArvore).
(async function () {
  const { sei, configuracoes } = globalThis.ExtensaoIFTO
  const { novoDocumentoSempreVisivel } = await configuracoes.lerConfiguracoes()
  if (!novoDocumentoSempreVisivel) return

  const barra = document.querySelector('#divArvoreAcoes')
  if (!barra) return

  function jaTemBotao () {
    return barra.querySelector('a[href*="acao=documento_escolher_tipo"], a[href*="acao=documento_receber"]')
  }

  function adicionarBotao () {
    if (jaTemBotao()) return true
    const frameArvore = window.parent.document.getElementById('ifrArvore')
    const cabecalho = frameArvore && frameArvore.contentWindow.document.head
    const link = cabecalho && sei.extrairLinkNovoDocumento(cabecalho.innerHTML)
    if (!link) return false
    // DOMParser não roda scripts; o link vem do próprio SEI.
    const botao = new DOMParser().parseFromString(link, 'text/html').body.firstElementChild
    if (!botao) return false
    botao.dataset.extensaoIfto = 'novo-documento'
    barra.prepend(document.importNode(botao, true))
    return true
  }

  // A barra é preenchida pelo SEI depois que a página abre: tenta agora e a cada mudança dela.
  if (adicionarBotao()) return
  const observador = new MutationObserver(() => {
    if (adicionarBotao()) observador.disconnect()
  })
  observador.observe(barra, { childList: true })
})()
