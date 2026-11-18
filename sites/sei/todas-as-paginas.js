// Em toda página do SEI: guarda a versão e o endereço do SEI, para a janela do ícone mostrar
// (e para as próximas etapas saberem com que SEI estão lidando).
(function () {
  const { sei } = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  // v0.22.0: número e nome da unidade aberta, para a janela do editor (que não mostra a unidade) saber
  // em que unidade está. Grava só quando muda.
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  const numero = campoUnidade && sei.numeroDaUnidade(campoUnidade.getAttribute('onclick'))
  if (numero) {
    const nome = campoUnidade.textContent.trim()
    navegador.storage.local.get('unidadesSei').then(({ unidadesSei = {} }) => {
      if (unidadesSei[numero] !== nome) navegador.storage.local.set({ unidadesSei: { ...unidadesSei, [numero]: nome } })
    })
  }
  const script = document.querySelector('script[src^="js/sei.js?"]')
  if (!script) return
  const versao = sei.versaoDoSei(script.getAttribute('src'))
  if (!versao) return
  navegador.storage.local.set({
    seiVisto: { versao, endereco: location.origin, vistoEm: new Date().toISOString() }
  })
})()
