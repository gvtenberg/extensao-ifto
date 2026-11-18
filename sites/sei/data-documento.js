// v0.23.0 (spec data-documento): na janela do editor do SEI, em Ofício e Portaria com data de um dia que já
// passou (a seção da data não dá para editar no SEI 5), um aviso com o botão "Mudar a data para hoje".
// A extensão troca só a data no texto do editor; a pessoa confere e clica em Salvar (nunca salva aqui).
(async function () {
  if (window.top !== window) return
  const { dataDocumento: regras, caixaEditor } = globalThis.ExtensaoIFTO
  if (!regras.ehOficioOuPortaria(document.title)) return

  const verificado = await caixaEditor.pedirAoFundo('dataVerificar')
  if (!verificado || !verificado.ok || !verificado.passou) return

  const caixa = caixaEditor.criarCaixa('data-documento', `Este documento está com a data de ${verificado.data}, que já passou. O SEI não deixa mudar essa data no editor.`, 'Mudar a data para hoje')
  caixa.botao.addEventListener('click', async () => {
    caixa.botao.disabled = true
    caixa.botao.textContent = 'Mudando…'
    const resultado = await caixaEditor.pedirAoFundo('dataAtualizar')
    if (!resultado || !resultado.ok) {
      caixa.mostrar('erro', 'Não consegui mudar a data. ' + ((resultado && resultado.erro) || '') + ' Nada foi salvo.')
      return
    }
    caixa.mostrar('ok', `Data mudada para ${resultado.nova}. Confira o documento e clique em Salvar no editor. Se algo saiu errado, feche o editor sem salvar.`)
  })
})()
