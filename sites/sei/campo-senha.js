// v0.1.1: senha reconhecida pelo navegador na tela de entrada do SEI e na assinatura de documentos.
// O SEI 5 usa o MaskedPassword: o campo visível vira texto com "●" e a senha vai para um campo escondido,
// e o Firefox deixa de oferecer (e de guardar) a senha. Aqui trocamos os dois por um campo de senha comum,
// igual ao do SEI antigo: mesmo id e nome "pwdSenha", então o SEI continua lendo e enviando a senha.
(async function () {
  const { sei, configuracoes } = globalThis.ExtensaoIFTO
  const { senhaReconhecidaPeloNavegador } = await configuracoes.lerConfiguracoes()
  if (!senhaReconhecidaPeloNavegador) return

  function consertarCampo () {
    const visivel = document.querySelector('input#pwdSenha.masked:not([type="password"])')
    if (!visivel) return false
    const caixa = visivel.parentNode
    const escondido = caixa.querySelector('input[type="password"][name]')
    const nome = (escondido && escondido.name) || 'pwdSenha'

    // Campo novo (sem os ouvintes do MaskedPassword); o "onkeypress" do SEI (Enter assina) é mantido.
    const campo = document.createElement('input')
    for (const [atributo, valor] of sei.atributosDoCampoDeSenha(visivel.attributes, nome)) {
      campo.setAttribute(atributo, valor)
    }
    const estavaEmFoco = document.activeElement === visivel
    if (escondido) escondido.remove()
    visivel.replaceWith(campo)
    if (estavaEmFoco) campo.focus()
    return true
  }

  // O SEI monta o campo quando a página termina de abrir; se ainda não montou, espera (até 15 segundos).
  if (consertarCampo()) return
  const observador = new MutationObserver(() => {
    if (consertarCampo()) observador.disconnect()
  })
  observador.observe(document.documentElement, { childList: true, subtree: true })
  setTimeout(() => observador.disconnect(), 15000)
})()
