// v0.23.0 (spec data-documento): na janela do editor do SEI, em Ofício e Portaria com data de um dia que já
// passou (a seção da data não dá para editar no SEI 5), um aviso com o botão "Mudar a data para hoje".
// v0.26.9 (spec conferir-documento, etapa 8): vale para todo documento: avisa a data com mês ou ano errado,
// de um dia que ainda não chegou ou escrita fora do padrão ("Palmas, 1º de dezembro de 2026."), com o botão
// "Corrigir a data". A extensão troca só a data no texto do editor; a pessoa confere e clica em Salvar.
(async function () {
  if (window.top !== window) return
  const { configuracoes, caixaEditor } = globalThis.ExtensaoIFTO
  const opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.conferirData) return

  const titulo = document.title
  const verificado = await caixaEditor.pedirAoFundo('dataVerificar', { titulo })
  const conferido = verificado && verificado.ok && verificado.conferido
  if (!conferido || conferido.certo) return

  const caixa = caixaEditor.criarCaixa('data-documento', 'Confira a data do documento:', `Corrigir para "${conferido.nova}"`)
  const lista = caixaEditor.criar('ul')
  for (const problema of conferido.problemas) lista.append(caixaEditor.criar('li', { textContent: problema }))
  caixa.botao.before(lista)
  caixa.botao.addEventListener('click', async () => {
    caixa.botao.disabled = true
    caixa.botao.textContent = 'Corrigindo…'
    const resultado = await caixaEditor.pedirAoFundo('dataAtualizar', { titulo })
    if (!resultado || !resultado.ok) {
      caixa.mostrar('erro', 'Não consegui corrigir a data. ' + ((resultado && resultado.erro) || '') + ' Nada foi salvo.')
      return
    }
    caixa.mostrar('ok', `Data trocada para ${resultado.nova}. Confira o documento e clique em Salvar no editor. Para desfazer, use Ctrl+Z ou feche o editor sem salvar.`)
  })
})()
