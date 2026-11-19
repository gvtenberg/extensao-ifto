// Janela do ícone: versão da extensão e aviso quando o SEI não foi reconhecido.
(async function () {
  const navegador = globalThis.browser || globalThis.chrome
  document.getElementById('versao').textContent = 'Versão ' + navegador.runtime.getManifest().version

  // v0.17.6 (pedido de 13/11/2026): mensagem de sucesso não aparece; só o aviso, com o motivo, quando o SEI
  // ainda não foi reconhecido ou está numa versão em que a extensão não foi testada.
  // v0.28.0 (spec aviso-versao-sei, D2): SEI não testado: desativar a extensão no SEI ou ativar de novo.
  const { sei } = globalThis.ExtensaoIFTO
  const caixa = document.getElementById('sei')
  const botaoDesativar = document.getElementById('desativar-sei')
  const botaoAtivar = document.getElementById('ativar-sei')
  async function mostrarSei () {
    const { seiVisto } = await navegador.storage.local.get('seiVisto')
    const { estado } = await sei.estadoAtualNoSei()
    caixa.className = 'aviso pendencia'
    caixa.hidden = false
    botaoDesativar.hidden = !seiVisto || estado === 'testado' || estado === 'desligada'
    botaoAtivar.hidden = estado !== 'desligada'
    if (!seiVisto) {
      caixa.textContent = 'A extensão ainda não reconheceu o SEI do IFTO: ele não foi aberto neste navegador desde a instalação. Abra o SEI e entre com sua senha.'
    } else if (estado === 'desligada') {
      caixa.textContent = `A extensão está desativada no SEI (versão ${seiVisto.versao}, ainda não testada). Para usar as funções dela de novo, clique em "Ativar de novo" e abra outra página do SEI.`
    } else if (estado !== 'testado') {
      caixa.textContent = `O SEI do IFTO mudou para a versão ${seiVisto.versao}, e a extensão foi testada na versão ${sei.VERSAO_SEI_TESTADA}. Algumas funções podem não funcionar: se notar algum erro, avise.`
    } else {
      caixa.hidden = true
    }
  }
  botaoDesativar.addEventListener('click', async () => {
    await sei.gravarEscolhaNoSei((await sei.estadoAtualNoSei()).versao, false)
    mostrarSei()
  })
  botaoAtivar.addEventListener('click', async () => {
    await sei.gravarEscolhaNoSei((await sei.estadoAtualNoSei()).versao, true)
    mostrarSei()
  })
  await mostrarSei()

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

  // v0.1.3: procurar atualização na hora, na última versão publicada (ver comum/atualizacao.js).
  // v0.17.2 (pedido de 13/11/2026): instalar pela janela não funcionava; havendo versão nova, só aparece o
  // botão que abre a página da versão (lá a pessoa clica no arquivo). Também no Chrome (mesma página).
  const { atualizacao } = globalThis.ExtensaoIFTO
  const versaoInstalada = navegador.runtime.getManifest().version
  const botaoProcurar = document.getElementById('procurar-atualizacao')
  const avisoAtualizacao = document.getElementById('atualizacao')
  const botaoPagina = document.getElementById('pagina-atualizacao')
  let paginaDaVersao = ''

  function avisar (tipo, texto) {
    avisoAtualizacao.hidden = false
    avisoAtualizacao.className = 'aviso ' + tipo
    avisoAtualizacao.textContent = texto
  }

  botaoProcurar.addEventListener('click', async () => {
    botaoProcurar.disabled = true
    botaoPagina.hidden = true
    avisar('pendencia', 'Procurando atualização…')
    try {
      const resposta = await fetch(atualizacao.ENDERECO_ULTIMA_RELEASE, { cache: 'no-store' })
      const release = resposta.ok ? atualizacao.lerRelease(await resposta.json()) : null
      if (!release) {
        avisar('pendencia', 'Ainda não há versão para instalar. Tente de novo mais tarde.')
      } else if (atualizacao.compararVersoes(release.versao, versaoInstalada) > 0) {
        paginaDaVersao = release.pagina || atualizacao.ENDERECO_PAGINA_ULTIMA_VERSAO
        botaoPagina.textContent = `Abrir a página da versão ${release.versao}`
        botaoPagina.hidden = false
        avisar('sucesso', `Versão ${release.versao} disponível (você tem a ${versaoInstalada}).`)
      } else {
        avisar('sucesso', `Você já tem a versão mais nova (${versaoInstalada}).`)
      }
    } catch (erro) {
      avisar('pendencia', 'Não foi possível procurar atualização. Confira a internet e tente de novo.')
    }
    botaoProcurar.disabled = false
  })

  botaoPagina.addEventListener('click', () => {
    navegador.tabs.create({ url: paginaDaVersao || atualizacao.ENDERECO_PAGINA_ULTIMA_VERSAO })
    window.close()
  })
})()
