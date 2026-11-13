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

  // v0.1.3: procurar atualização na hora, na última Release do GitHub (ver comum/atualizacao.js).
  const { atualizacao } = globalThis.ExtensaoIFTO
  const versaoInstalada = navegador.runtime.getManifest().version
  const botaoProcurar = document.getElementById('procurar-atualizacao')
  // v0.5.0: no Chrome (sem "browser"), a atualização é trocar a pasta pela do pacote novo; o botão
  // procuraria a versão do Firefox, então fica escondido.
  if (!globalThis.browser) {
    botaoProcurar.hidden = true
    return
  }
  const avisoAtualizacao = document.getElementById('atualizacao')
  const linkPagina = document.getElementById('pagina-atualizacao')

  function avisar (tipo, texto) {
    avisoAtualizacao.hidden = false
    avisoAtualizacao.className = 'aviso ' + tipo
    avisoAtualizacao.textContent = texto
  }

  botaoProcurar.addEventListener('click', async () => {
    botaoProcurar.disabled = true
    linkPagina.hidden = true
    avisar('pendencia', 'Procurando atualização…')
    try {
      const resposta = await fetch(atualizacao.ENDERECO_ULTIMA_RELEASE, { cache: 'no-store' })
      const release = resposta.ok ? atualizacao.lerRelease(await resposta.json()) : null
      if (!release) {
        avisar('pendencia', 'Ainda não há versão para instalar. Tente de novo mais tarde.')
      } else if (atualizacao.compararVersoes(release.versao, versaoInstalada) > 0) {
        // v0.9.7: o link direto para o arquivo (v0.9.1) não instalava; fica só a página da versão, onde a
        // pessoa clica no arquivo .xpi. As configurações e a lista de assinaturas são mantidas.
        linkPagina.textContent = `Abrir a página da versão ${release.versao}`
        linkPagina.href = release.pagina
        linkPagina.hidden = false
        avisar('sucesso', `Versão ${release.versao} disponível (você tem a ${versaoInstalada}). Clique em "Abrir a página da versão ${release.versao}"; na página, clique no arquivo que termina em .xpi, depois em "Permitir" e em "Adicionar".`)
      } else {
        avisar('sucesso', `Você já tem a versão mais nova (${versaoInstalada}).`)
      }
    } catch (erro) {
      avisar('pendencia', 'Não foi possível procurar atualização. Confira a internet e tente de novo.')
    }
    botaoProcurar.disabled = false
  })
})()
