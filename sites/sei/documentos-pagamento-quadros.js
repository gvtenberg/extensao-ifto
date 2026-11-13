// v0.8.0: passos da inclusão dos documentos do pagamento dentro do quadro da direita (spec documentos-pagamento).
// Só age quando há uma tarefa guardada para o MESMO processo (id_procedimento do endereço).
// - Gerar Documento (documento_escolher_tipo): clica em "Externo".
// - Página do processo depois do Salvar: marca "salvo" (a página de cima passa ao próximo tipo).
// - Documento externo novo (documento_receber): escolhe o tipo (o SEI recarrega a página), depois preenche
//   data de hoje, Nato-digital e Público e clica em Salvar. A pergunta de documento repetido é do SEI.
(async function () {
  const { documentosPagamento: regras, documentoExterno } = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  const CHAVE_TAREFA = 'documentosPagamentoTarefa'
  const parametros = new URL(location.href).searchParams
  const acao = parametros.get('acao')
  const idProcesso = parametros.get('id_procedimento')

  const { [CHAVE_TAREFA]: tarefa } = await navegador.storage.local.get(CHAVE_TAREFA)
  if (!tarefa || !idProcesso || tarefa.idProcesso !== idProcesso) return
  const tipo = tarefa.tipos[tarefa.posicao]
  async function passo (nome) {
    Object.assign(tarefa, { passo: nome, desde: Date.now() })
    await navegador.storage.local.set({ [CHAVE_TAREFA]: tarefa })
  }

  // Depois do Salvar, o SEI abre a página do processo (com #divArvoreHtml) no quadro do formulário
  // (o SEI++ confere o mesmo, dropzone.js): o documento foi incluído.
  if (acao === 'arvore_visualizar' || acao === 'procedimento_visualizar') {
    if (tarefa.passo === 'salvando' && document.getElementById('divArvoreHtml')) await passo('salvo')
    return
  }

  if (acao === 'documento_escolher_tipo') {
    if (tarefa.passo !== 'incluir') return
    const externo = document.querySelector('a[onclick="escolher(-1)"]')
    if (!externo) return
    await passo('tipo')
    externo.click()
    return
  }

  if (!documentoExterno.ehDocumentoExternoNovo(location.href)) return
  if (tarefa.passo !== 'tipo' && tarefa.passo !== 'preencher') return
  const lista = document.getElementById('selSerie')
  if (!lista) return
  const opcao = regras.acharOpcao([...lista.options].map(item => ({ valor: item.value, texto: item.textContent })), tipo)
  if (!opcao) {
    // Sem o tipo na lista: a página de cima para a tarefa pelo tempo; avisa já aqui.
    await passo('erro')
    window.alert(`O tipo de documento "${tipo}" não aparece na lista do SEI. A inclusão vai parar.`)
    return
  }

  // 1º: escolher o tipo. O SEI envia o formulário e reabre a página com o tipo escolhido.
  if (lista.value !== opcao.valor) {
    if (tarefa.passo === 'preencher') { await passo('erro'); return } // o tipo não ficou: não insiste
    await passo('preencher')
    lista.value = opcao.valor
    lista.dispatchEvent(new Event('change', { bubbles: true }))
    return
  }

  // 2º: tipo já escolhido. Preenche (só o que a tarefa pede) e salva.
  const campoData = document.getElementById('txtDataElaboracao')
  const nato = document.getElementById('optNato')
  const publico = document.getElementById('optPublico')
  const salvar = document.getElementById('btnSalvar')
  if (!campoData || !nato || !publico || !salvar) return
  campoData.value = documentoExterno.dataDeHoje()
  if (!nato.checked) nato.click()
  if (!publico.checked) publico.click()
  await passo('salvando')
  salvar.click()
})()
