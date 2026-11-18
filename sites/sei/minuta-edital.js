// v0.22.0 (spec minuta-edital): na janela do editor do SEI, em documento do tipo Edital que ainda tem a marca
// d'água MINUTA (veio da minuta usada como modelo), um aviso com o botão "Remover marca MINUTA". A extensão
// tira a marca do texto do editor; a pessoa confere e clica em Salvar (a extensão nunca salva aqui).
// Opção "automatica": só na Direção-geral.
(async function () {
  if (window.top !== window) return
  const { minutaEdital: regras, configuracoes, sei } = globalThis.ExtensaoIFTO
  const navegador = globalThis.browser || globalThis.chrome
  if (!regras.ehEdital(document.title)) return

  const opcoes = await configuracoes.lerConfiguracoes()
  if (!regras.funcaoLigada(opcoes.minutaEdital, await unidadeAberta())) return

  // O editor não mostra a unidade: vem do número no endereço (gravado pelas páginas do SEI) ou da janela
  // do SEI que abriu o editor.
  async function unidadeAberta () {
    const numero = sei.numeroDaUnidade(location.href)
    const { unidadesSei = {} } = await navegador.storage.local.get('unidadesSei')
    if (numero && unidadesSei[numero]) return unidadesSei[numero]
    try {
      const campo = window.opener && window.opener.top.document.getElementById('lnkInfraUnidade')
      if (campo) return campo.textContent.trim()
    } catch (erro) {}
    return ''
  }

  const { criarCaixa, pedirAoFundo: pedir, criar } = globalThis.ExtensaoIFTO.caixaEditor
  const verificado = await pedir('minutaVerificar')
  if (!verificado || !verificado.ok || !verificado.marcas) return

  const caixa = criarCaixa('minuta-edital', 'Este edital ainda tem a marca "MINUTA", que veio da minuta (no fundo da página e do PDF, ou nas linhas "* MINUTA DE DOCUMENTO").', 'Remover marca MINUTA')
  const botao = caixa.botao

  function mostrar (classe, texto, trechos = []) {
    const extras = []
    if (trechos.length) {
      const lista = criar('ul')
      lista.append(...trechos.map(trecho => criar('li', { textContent: trecho })))
      extras.push(criar('p', { className: 'aviso', textContent: 'O texto ainda tem a palavra "minuta" aqui (corrija à mão, se for o caso):' }), lista)
    }
    caixa.mostrar(classe, texto, ...extras)
  }

  botao.addEventListener('click', async () => {
    botao.disabled = true
    botao.textContent = 'Removendo…'
    const resultado = await pedir('minutaRemover')
    if (!resultado || !resultado.ok) {
      mostrar('erro', 'Não consegui remover a marca. ' + ((resultado && resultado.erro) || '') + ' Nada foi salvo.')
      return
    }
    if (resultado.restou) {
      mostrar('erro', 'Tirei parte da marca, mas ela ainda está no texto. Não salve: feche o editor sem salvar e avise o responsável na CGOC.')
      return
    }
    mostrar('ok', 'Marca MINUTA removida do texto. Confira o documento e clique em Salvar no editor. Se algo saiu errado, feche o editor sem salvar.', resultado.trechos || [])
  })
})()
