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
})()
