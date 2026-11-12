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

  for (const caixa of document.querySelectorAll('input[type="checkbox"]')) {
    caixa.checked = Boolean(configuracoes[caixa.id])
    caixa.addEventListener('change', async () => {
      configuracoes[caixa.id] = caixa.checked
      await gravarConfiguracoes(configuracoes)
      aviso.hidden = false
    })
  }
})()
