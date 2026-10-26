// Em toda página do SEI: guarda a versão e o endereço do SEI, para a janela do ícone mostrar
// (e para as próximas etapas saberem com que SEI estão lidando).
(function () {
  const { sei } = globalThis.ExtensaoIFTO
  const script = document.querySelector('script[src^="js/sei.js?"]')
  if (!script) return
  const versao = sei.versaoDoSei(script.getAttribute('src'))
  if (!versao) return
  const navegador = globalThis.browser || globalThis.chrome
  navegador.storage.local.set({
    seiVisto: { versao, endereco: location.origin, vistoEm: new Date().toISOString() }
  })
})()
