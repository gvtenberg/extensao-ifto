// Página de configurações: cada escolha grava na hora no navegador (sem botão Gravar) e fica guardada.
(async function () {
  const { lerConfiguracoes, gravarConfiguracoes } = globalThis.ExtensaoIFTO.configuracoes
  const configuracoes = await lerConfiguracoes()
  const aviso = document.getElementById('gravado')

  // v0.3.0: escolhas de uma opção só (ex.: lista de assinaturas: automática, sempre, desligada).
  for (const escolha of document.querySelectorAll('input[type="radio"]')) {
    escolha.checked = configuracoes[escolha.name] === escolha.value
    escolha.addEventListener('change', async () => {
      if (!escolha.checked) return
      configuracoes[escolha.name] = escolha.value
      await gravarConfiguracoes(configuracoes)
      aviso.hidden = false
    })
  }

  // v0.13.0: permissão do SICAF (Compras.gov.br e Downloads). O pedido tem de sair direto do clique.
  const navegador = globalThis.browser || globalThis.chrome
  const pedidoSicaf = { origins: [...globalThis.ExtensaoIFTO.sicaf.ORIGENS_COMPRAS], permissions: ['downloads'] }
  const botaoSicaf = document.getElementById('permitirSicaf')
  const permitido = document.getElementById('sicafPermitido')
  const mostrarPermissao = sim => { botaoSicaf.hidden = sim; permitido.hidden = !sim }
  navegador.permissions.contains(pedidoSicaf).then(mostrarPermissao)
  botaoSicaf.addEventListener('click', () => {
    navegador.permissions.request(pedidoSicaf).then(mostrarPermissao)
  })
  if (location.hash === '#sicaf') {
    const cartao = document.getElementById('sicaf')
    cartao.scrollIntoView({ block: 'center' })
    cartao.style.outline = '3px solid var(--marca)'
  }

  for (const caixa of document.querySelectorAll('input[type="checkbox"]')) {
    caixa.checked = Boolean(configuracoes[caixa.id])
    caixa.addEventListener('change', async () => {
      configuracoes[caixa.id] = caixa.checked
      await gravarConfiguracoes(configuracoes)
      aviso.hidden = false
    })
  }
})()
