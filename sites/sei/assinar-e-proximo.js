// v0.5.0: "Assinar e próximo" da lista de assinaturas, dentro da janela de assinatura do SEI
// (acao=documento_assinar). Só age quando o painel acabou de pedir (listaAssinaturas.pendente, há menos de
// 1 minuto): se o Firefox já preencheu a senha guardada e o cargo está escolhido, clica em "Assinar" uma vez.
// Senão, deixa o cursor na senha para a pessoa digitar e apertar Enter. Em qualquer caso, quando a pessoa
// (ou a extensão) envia, marca "enviado" para o painel avançar depois que o SEI confirmar.
// A senha nunca é lida nem guardada pela extensão; só se confere se o campo está preenchido.
(async function () {
  const navegador = globalThis.browser || globalThis.chrome
  const CHAVE = 'listaAssinaturas'
  const { [CHAVE]: lista } = await navegador.storage.local.get(CHAVE)
  const pendente = lista && lista.pendente
  if (!pendente || pendente.tipo !== 'assinar' || pendente.enviado) return
  if (Date.now() - pendente.desde > 60 * 1000) return

  async function marcarEnviado () {
    const { [CHAVE]: atual } = await navegador.storage.local.get(CHAVE)
    if (!atual || !atual.pendente || atual.pendente.enviado) return
    atual.pendente.enviado = true
    await navegador.storage.local.set({ [CHAVE]: atual })
  }

  // A pessoa assinou por conta própria (botão Assinar ou Enter na senha).
  document.addEventListener('click', evento => {
    if (evento.target.closest && evento.target.closest('#btnAssinar')) marcarEnviado()
  }, true)
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Enter' && evento.target && evento.target.id === 'pwdSenha') marcarEnviado()
  }, true)

  // Espera o Firefox preencher a senha e o SEI carregar o cargo (até 5 segundos).
  const inicio = Date.now()
  const conferir = setInterval(async () => {
    const senha = document.getElementById('pwdSenha')
    const cargo = document.getElementById('selCargoFuncao')
    const botao = document.getElementById('btnAssinar')
    const pronto = senha && senha.value && botao && (!cargo || cargo.value)
    if (pronto) {
      clearInterval(conferir)
      await marcarEnviado()
      botao.click()
      return
    }
    if (Date.now() - inicio > 5000) {
      clearInterval(conferir)
      if (senha) senha.focus()
    }
  }, 250)
})()
