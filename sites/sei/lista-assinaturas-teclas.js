// v0.3.0: atalhos da lista de assinaturas (Alt+→ e Alt+←) com o foco dentro de um quadro do SEI
// (árvore, documento). Só avisa a página principal, onde fica o painel (sites/sei/lista-assinaturas.js).
// Sem lista guardada, não faz nada: Alt+← continua sendo "Voltar" do navegador.
(async function () {
  if (window.top === window) return
  const navegador = globalThis.browser || globalThis.chrome
  const CHAVE = 'listaAssinaturas'
  let temLista = Boolean((await navegador.storage.local.get(CHAVE))[CHAVE])
  navegador.storage.onChanged.addListener((mudancas, area) => {
    if (area === 'local' && mudancas[CHAVE]) temLista = Boolean(mudancas[CHAVE].newValue)
  })
  document.addEventListener('keydown', evento => {
    if (!temLista || !evento.altKey || evento.ctrlKey || evento.shiftKey || evento.metaKey) return
    const acao = { ArrowRight: 'proximo', ArrowLeft: 'anterior' }[evento.key]
    if (!acao) return
    try {
      if (window.top.location.origin !== location.origin) return
    } catch (erro) {
      return
    }
    evento.preventDefault()
    window.top.postMessage({ extensaoIfto: 'lista-assinaturas-tecla', acao }, location.origin)
  }, true)
})()
