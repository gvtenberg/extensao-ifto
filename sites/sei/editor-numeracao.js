// v0.25.0 (spec numeracao-edital): roda DENTRO da página do editor do SEI 5 (a parte de fundo o coloca com
// scripting.executeScript, world MAIN, junto com comum/numeracao-edital.js). Procura itens de edital com o
// texto empurrado para a linha de baixo pelo número longo e avisa a caixa da extensão (window.postMessage);
// procura de novo quando o texto muda. Só corrige com o clique da pessoa. Nunca salva.
(function (raiz) {
  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))
  const regras = () => raiz.ExtensaoIFTO.numeracaoEdital

  async function acharEditor () {
    const limite = Date.now() + 30000
    while (Date.now() < limite) {
      const infra = raiz.infraEditor
      const editor = infra && infra.editor
      if (editor && editor.model && editor.editing) return editor
      await esperar(300)
    }
    return null
  }

  // Parágrafo quebrado: a primeira letra do texto fica abaixo da primeira linha do parágrafo.
  function quebrado (paragrafo) {
    const andador = document.createTreeWalker(paragrafo, NodeFilter.SHOW_TEXT, { acceptNode: no => no.data.trim() && !no.parentElement.closest('style') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP })
    const texto = andador.nextNode()
    if (!texto) return false
    const inicio = texto.data.search(/\S/)
    const trecho = document.createRange()
    trecho.setStart(texto, inicio)
    trecho.setEnd(texto, inicio + 1)
    const letra = trecho.getBoundingClientRect()
    const caixa = paragrafo.getBoundingClientRect()
    const linha = parseFloat(getComputedStyle(paragrafo).lineHeight) || parseFloat(getComputedStyle(paragrafo).fontSize) * 1.2
    return letra.height > 0 && letra.top - caixa.top - (parseFloat(getComputedStyle(paragrafo).paddingTop) || 0) > linha * 0.6
  }

  function procurar () {
    const seletor = regras().CLASSES.map(classe => '.ck-editor__editable p.' + classe).join(',')
    const achados = [...document.querySelectorAll(seletor)].filter(quebrado)
    return { quebrados: achados.length, exemplos: achados.slice(0, 3).map(p => p.textContent.trim().slice(0, 40)) }
  }

  function avisar (resultado) {
    raiz.postMessage({ extensaoIftoNumeracao: true, ...resultado }, raiz.location.origin)
  }

  let editorPreparado = null
  async function preparar () {
    try {
      const editor = await acharEditor()
      if (!editor) return { ok: false, erro: 'O editor do SEI não abriu a tempo.' }
      if (document.fonts && document.fonts.ready) await document.fonts.ready
      await esperar(500)
      editorPreparado = editor
      if (!editor.__extensaoIftoNumeracao) {
        editor.__extensaoIftoNumeracao = true
        let espera = null
        editor.model.document.on('change:data', () => {
          clearTimeout(espera)
          espera = setTimeout(() => avisar(procurar()), 1500)
        })
      }
      const resultado = procurar()
      avisar(resultado)
      return { ok: true, erro: '', ...resultado }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  // Põe um bloco de estilo no começo de um parágrafo do editor (o SEI guarda e imprime o bloco; dá para
  // desfazer com Ctrl+Z). v0.26.11: também usado pelo espaçamento (editor-espacamento.js).
  function porBloco (editor, alvo, bloco) {
    const modelo = editor.model
    const pedaco = editor.data.toModel(editor.data.processor.toView(bloco), '$block')
    modelo.change(escritor => { modelo.insertContent(pedaco, escritor.createPositionAt(alvo, 0)) })
  }

  // Põe o bloco de estilo no começo do primeiro item de edital da seção (o editor guarda e imprime o bloco).
  async function corrigir () {
    try {
      const editor = editorPreparado || await acharEditor()
      if (!editor) return { ok: false, erro: 'Não achei o editor do SEI.' }
      const modelo = editor.model
      for (const nome of modelo.document.getRootNames()) {
        if (regras().temCorrecao(editor.getData({ rootName: nome }))) return { ok: true, erro: '', ...procurar(), jaTinha: true }
      }
      const classes = regras().CLASSES
      let alvo = null
      for (const nome of modelo.document.getRootNames()) {
        if (typeof editor.isRootDisabled === 'function' && editor.isRootDisabled(nome)) continue
        for (const { item } of modelo.createRangeIn(modelo.document.getRoot(nome))) {
          if (item.is('element', 'paragraph') && classes.includes(item.getAttribute('estilo'))) { alvo = item; break }
        }
        if (alvo) break
      }
      if (!alvo) return { ok: false, erro: 'Não achei um item de edital que dê para editar.' }
      porBloco(editor, alvo, regras().BLOCO)
      const dados = editor.getData({ rootName: alvo.root.rootName })
      if (!regras().temCorrecao(dados)) return { ok: false, erro: 'O editor não aceitou a correção.' }
      await esperar(300)
      return { ok: true, erro: '', ...procurar() }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { editorNumeracao: { preparar, corrigir, procurar, acharEditor, porBloco } })
})(globalThis)
