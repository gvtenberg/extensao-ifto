// v0.25.0 (spec numeracao-edital): na janela do editor do SEI, em qualquer documento e unidade, a caixa
// "Corrigir a numeração" aparece só quando um item de edital (nível 2, 3 ou 4) está com o texto empurrado para
// a linha de baixo por um número longo ("10.10."). Nada muda sem o clique; a pessoa confere e clica em Salvar.
(async function () {
  if (window.top !== window) return
  const navegador = globalThis.browser || globalThis.chrome
  const { configuracoes, caixaEditor } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.numeracaoEdital) return

  let caixa = null
  let corrigindo = false
  const texto = n => n === 1
    ? 'Um item numerado do edital está com o texto na linha de baixo, porque o número (como "10.10.") não cabe no espaço.'
    : `${n} itens numerados do edital estão com o texto na linha de baixo, porque o número (como "10.10.") não cabe no espaço.`

  function mostrar (quebrados) {
    if (corrigindo) return
    if (!quebrados) { if (caixa) { caixa.hospedeiro.remove(); caixa = null } return }
    if (caixa && document.body.contains(caixa.hospedeiro)) { caixa.corpo.querySelector('p').textContent = texto(quebrados); return }
    caixa = caixaEditor.criarCaixa('numeracao-edital', texto(quebrados), 'Corrigir a numeração')
    caixa.hospedeiro = document.querySelector('[data-extensao-ifto="numeracao-edital"]')
    caixa.botao.addEventListener('click', async () => {
      corrigindo = true
      caixa.botao.disabled = true
      caixa.botao.textContent = 'Corrigindo…'
      const resultado = await caixaEditor.pedirAoFundo('numeracaoCorrigir')
      if (!resultado || !resultado.ok) {
        caixa.mostrar('erro', 'Não consegui corrigir. ' + ((resultado && resultado.erro) || '') + ' Nada foi salvo.')
        corrigindo = false
        return
      }
      caixa.mostrar('ok', 'Pronto: os números longos ganharam espaço e os outros ficaram iguais. Confira e clique em Salvar no editor. Para desfazer, use Ctrl+Z ou feche o editor sem salvar.')
    })
  }

  // Avisos da parte que roda dentro do editor (procura de novo quando o texto muda).
  window.addEventListener('message', evento => {
    if (evento.source !== window || !evento.data || !evento.data.extensaoIftoNumeracao) return
    mostrar(Number(evento.data.quebrados) || 0)
  })
  navegador.runtime.sendMessage({ tipo: 'numeracaoPreparar' }).catch(() => {})
})()
