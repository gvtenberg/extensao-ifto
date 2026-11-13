// Janela do ícone: versão da extensão e o último SEI visto (versão e endereço).
(async function () {
  const navegador = globalThis.browser || globalThis.chrome
  document.getElementById('versao').textContent = 'Versão ' + navegador.runtime.getManifest().version

  const { seiVisto } = await navegador.storage.local.get('seiVisto')
  const caixa = document.getElementById('sei')
  if (seiVisto) {
    const quando = new Date(seiVisto.vistoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    caixa.className = 'aviso sucesso'
    caixa.textContent = `SEI do IFTO reconhecido (versão ${seiVisto.versao}), aberto em ${quando}.`
  } else {
    caixa.className = 'aviso pendencia'
    caixa.textContent = 'Abra o SEI do IFTO para a extensão reconhecê-lo.'
  }

  // v0.9.6: no Firefox, sem a licença permanente para o SEI, a extensão só age na página aberta quando a
  // pessoa clica no ícone, e some ao trocar de página (ex.: a lista de assinaturas ao abrir o processo).
  // Aqui confere a licença e, se faltar, oferece o botão que a pede (o clique da pessoa é obrigatório).
  const enderecosSei = navegador.runtime.getManifest().host_permissions || []
  const avisoAcesso = document.getElementById('acesso')
  const botaoPermitir = document.getElementById('permitir-sei')
  async function conferirAcesso () {
    let temAcesso = true
    try { temAcesso = await navegador.permissions.contains({ origins: enderecosSei }) } catch (erro) { temAcesso = true }
    avisoAcesso.hidden = temAcesso
    botaoPermitir.hidden = temAcesso
  }
  botaoPermitir.addEventListener('click', () => {
    navegador.permissions.request({ origins: enderecosSei }).then(conferirAcesso, conferirAcesso)
  })
  conferirAcesso()

  document.getElementById('abrir-configuracoes').addEventListener('click', () => {
    navegador.runtime.openOptionsPage()
    window.close()
  })

  // v0.17.0 (pedido de 13/11/2026): procurar e instalar pela janela não funcionava; o botão só abre a
  // página da versão mais nova, onde a pessoa clica no arquivo (.xpi no Firefox, .zip no Chrome).
  document.getElementById('pagina-atualizacao').addEventListener('click', () => {
    navegador.tabs.create({ url: globalThis.ExtensaoIFTO.atualizacao.ENDERECO_PAGINA_ULTIMA_VERSAO })
    window.close()
  })
})()
