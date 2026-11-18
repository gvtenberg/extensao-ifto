// v0.26.2 (spec conferir-documento): na janela do editor do SEI, em qualquer unidade, confere a linha
// "Processo nº:" do alto do documento com o processo em que ele está ("Referência: Processo nº …").
// Errado: aviso com o botão "Corrigir o número do processo" (troca só o número). Nunca salva: a pessoa
// confere e clica em Salvar. No título do Edital (número em link do SEI) só avisa (D17).
(async function () {
  if (window.top !== window) return
  const { configuracoes, caixaEditor, conferirDocumento: regras } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.conferirProcesso) return

  const verificado = await caixaEditor.pedirAoFundo('conferirVerificar')
  const processo = verificado && verificado.ok && verificado.processo
  if (!processo || processo.certo) return

  const caixa = caixaEditor.criarCaixa('conferir-processo', regras.avisoDoProcesso(processo), 'Corrigir o número do processo')
  // No alto, para não cobrir as outras caixas da extensão (ficam embaixo).
  Object.assign(caixa.corpo.parentElement.style, { top: '16px', bottom: 'auto' })
  if (processo.link || !processo.editavel) {
    caixa.botao.remove()
    caixa.corpo.append(caixaEditor.criar('p', {
      className: 'aviso',
      textContent: processo.link
        ? 'O número está num link do SEI: apague-o e coloque o link do processo certo; depois clique em Salvar.'
        : 'Essa parte do documento não dá para mudar no editor.'
    }))
    return
  }
  caixa.botao.addEventListener('click', async () => {
    caixa.botao.disabled = true
    caixa.botao.textContent = 'Corrigindo…'
    const resultado = await caixaEditor.pedirAoFundo('conferirCorrigir', { qual: 'processo' })
    if (!resultado || !resultado.ok) {
      caixa.mostrar('erro', 'Não consegui corrigir. ' + ((resultado && resultado.erro) || '') + ' Nada foi salvo.')
      return
    }
    caixa.mostrar('ok', `Número trocado para ${processo.processo}. Confira e clique em Salvar no editor. Para desfazer, use Ctrl+Z ou feche o editor sem salvar.`)
  })
})()
