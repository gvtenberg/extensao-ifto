// v0.7.0: botão "Incluir Sicaf, Consulta e Anexo" na barra da extensão (spec documentos-pagamento).
// Só com um processo aberto (página com a árvore, #ifrArvore). A criação dos três documentos é a etapa 3.
(async function () {
  if (window.top !== window) return
  const { documentosPagamento: regras, configuracoes, barra } = globalThis.ExtensaoIFTO
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  if (!barra || !campoUnidade || !document.getElementById('ifrArvore')) return
  const unidade = campoUnidade.textContent.trim()
  const navegador = globalThis.browser || globalThis.chrome

  let opcoes = await configuracoes.lerConfiguracoes()
  const ID = 'documentos-pagamento'
  barra.botao(ID, {
    texto: 'Incluir ' + regras.TIPOS.join(', ').replace(/, ([^,]*)$/, ' e $1'),
    titulo: 'Incluir no processo os documentos externos em branco: ' + regras.TIPOS.join(', '),
    ordem: 20,
    aoClicar: () => window.alert('A inclusão automática dos documentos chega na próxima versão da extensão.')
  })
  const desenhar = () => barra.mostrar(ID, regras.funcaoLigada(opcoes.documentosPagamento, unidade))
  desenhar()

  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local' || !mudancas.configuracoes) return
    opcoes = await configuracoes.lerConfiguracoes()
    desenhar()
  })
})()
