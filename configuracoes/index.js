// Página de configurações: cada caixa de marcar grava na hora (sem botão Gravar).
(async function () {
  const { lerConfiguracoes, gravarConfiguracoes } = globalThis.ExtensaoIFTO.configuracoes
  const configuracoes = await lerConfiguracoes()
  const aviso = document.getElementById('gravado')

  for (const caixa of document.querySelectorAll('input[type="checkbox"]')) {
    caixa.checked = Boolean(configuracoes[caixa.id])
    caixa.addEventListener('change', async () => {
      configuracoes[caixa.id] = caixa.checked
      await gravarConfiguracoes(configuracoes)
      aviso.hidden = false
    })
  }
})()
