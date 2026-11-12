// Janela do ícone: versão da extensão e o último SEI visto (versão e endereço).
(async function () {
  const navegador = globalThis.browser || globalThis.chrome
  document.getElementById('versao').textContent = 'Versão ' + navegador.runtime.getManifest().version

  const { seiVisto } = await navegador.storage.local.get('seiVisto')
  const caixa = document.getElementById('sei')
  if (seiVisto) {
    const quando = new Date(seiVisto.vistoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    caixa.className = 'aviso sucesso'
    caixa.textContent = `SEI ${seiVisto.versao} em ${seiVisto.endereco} (visto em ${quando}).`
  } else {
    caixa.className = 'aviso pendencia'
    caixa.textContent = 'Abra o SEI do IFTO para a extensão reconhecê-lo.'
  }

  document.getElementById('abrir-configuracoes').addEventListener('click', () => {
    navegador.runtime.openOptionsPage()
    window.close()
  })

  // v0.1.3: procurar atualização na hora, na última Release do GitHub (ver comum/atualizacao.js).
  const { atualizacao } = globalThis.ExtensaoIFTO
  const versaoInstalada = navegador.runtime.getManifest().version
  const botaoProcurar = document.getElementById('procurar-atualizacao')
  const avisoAtualizacao = document.getElementById('atualizacao')
  const botaoInstalar = document.getElementById('instalar-atualizacao')

  function avisar (tipo, texto) {
    avisoAtualizacao.hidden = false
    avisoAtualizacao.className = 'aviso ' + tipo
    avisoAtualizacao.textContent = texto
  }

  botaoProcurar.addEventListener('click', async () => {
    botaoProcurar.disabled = true
    botaoInstalar.hidden = true
    avisar('pendencia', 'Procurando no GitHub…')
    try {
      const resposta = await fetch(atualizacao.ENDERECO_ULTIMA_RELEASE, { cache: 'no-store' })
      const release = resposta.ok ? atualizacao.lerRelease(await resposta.json()) : null
      if (!release) {
        avisar('pendencia', 'Nenhuma versão assinada no GitHub ainda. Se acabou de enviar o código, espere "Assinar extensão" terminar na aba Actions do GitHub (alguns minutos).')
      } else if (atualizacao.compararVersoes(release.versao, versaoInstalada) > 0) {
        avisar('sucesso', `Versão ${release.versao} disponível (instalada: ${versaoInstalada}).`)
        botaoInstalar.textContent = `Instalar a versão ${release.versao}`
        botaoInstalar.hidden = false
        botaoInstalar.onclick = () => {
          // O Firefox pede para permitir o GitHub e depois "Adicionar"; as configurações são mantidas.
          navegador.tabs.create({ url: release.link })
          window.close()
        }
      } else {
        avisar('sucesso', `Você já tem a versão mais nova (${versaoInstalada}). Se acabou de enviar o código, espere "Assinar extensão" terminar na aba Actions do GitHub e procure de novo.`)
      }
    } catch (erro) {
      avisar('pendencia', 'Não foi possível consultar o GitHub. Confira a internet e tente de novo.')
    }
    botaoProcurar.disabled = false
  })
})()
