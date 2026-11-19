// v0.26.11 (spec conferir-documento, etapa 7): roda DENTRO da página do editor do SEI 5 (a parte de fundo o
// coloca com scripting.executeScript, world MAIN, junto com comum/espacamento-documento.js e
// sites/sei/editor-numeracao.js, de onde vêm acharEditor e porBloco). "medir" lê a distância entre as partes
// do documento (as regras em comum/ decidem onde falta espaço), "por" põe o bloco de estilo e "tirar" o tira
// ("Desfazer"). Nunca salva: a pessoa confere e clica em Salvar.
(function (raiz) {
  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))
  const regras = () => raiz.ExtensaoIFTO.espacamentoDocumento
  const ajuda = () => raiz.ExtensaoIFTO.editorNumeracao
  const INVISIVEIS = /[\s ​-‍⁠﻿]/g
  const numero = valor => parseFloat(valor) || 0
  const estilo = elemento => getComputedStyle(elemento)

  // Texto que aparece (sem o de dentro dos blocos de estilo).
  function textoDe (elemento) {
    const andador = document.createTreeWalker(elemento, NodeFilter.SHOW_TEXT, { acceptNode: no => no.parentElement.closest('style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT })
    let texto = ''
    while (andador.nextNode()) texto += andador.currentNode.data
    return texto.replace(/\s+/g, ' ').trim()
  }
  const temConteudo = p => Boolean(textoDe(p).replace(INVISIVEIS, '')) || Boolean(p.querySelector('img'))

  // Alto da primeira linha e baixo da última (letras e imagens; a altura de linha de 10% não conta).
  function linhas (p) {
    let alto = Infinity
    let baixo = -Infinity
    const somar = retangulo => {
      if (!retangulo.width || !retangulo.height) return
      alto = Math.min(alto, retangulo.top)
      baixo = Math.max(baixo, retangulo.bottom)
    }
    const andador = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, { acceptNode: no => no.data.replace(INVISIVEIS, '') && !no.parentElement.closest('style') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP })
    const trecho = document.createRange()
    while (andador.nextNode()) {
      trecho.selectNodeContents(andador.currentNode)
      for (const retangulo of trecho.getClientRects()) somar(retangulo)
    }
    for (const imagem of p.querySelectorAll('img')) somar(imagem.getBoundingClientRect())
    return alto < baixo ? { alto, baixo } : null
  }

  const descritor = elemento => ({ tag: elemento.tagName.toLowerCase(), classes: [...elemento.classList].filter(classe => !/^ck/.test(classe)) })

  function medirBloco (elemento, raizDoTexto, secao, posicao) {
    const bloco = { ...descritor(elemento), raiz: raizDoTexto, secao, posicao, vazio: false, outro: false }
    const embrulho = bloco.tag === 'div' && !bloco.classes.length
    const paragrafos = bloco.tag === 'p' ? [elemento] : embrulho ? [...elemento.children] : []
    if (!paragrafos.length || paragrafos.some(p => p.tagName !== 'P')) return { ...bloco, outro: true }
    const comTexto = paragrafos.filter(temConteudo)
    if (!comTexto.length) return { ...bloco, vazio: true }
    const primeiro = comTexto[0]
    const ultimo = comTexto[comTexto.length - 1]
    const [cima, baixo] = [linhas(primeiro), linhas(ultimo)]
    if (!cima || !baixo) return { ...bloco, outro: true }
    return {
      ...bloco,
      texto: textoDe(primeiro).slice(0, 200),
      textoFim: textoDe(ultimo).slice(0, 200),
      topo: cima.alto,
      base: baixo.baixo,
      acima: cima.alto - primeiro.getBoundingClientRect().top,
      abaixo: ultimo.getBoundingClientRect().bottom - baixo.baixo,
      margemTopo: Math.max(numero(estilo(primeiro).marginTop), embrulho ? numero(estilo(elemento).marginTop) : 0),
      margemBaixo: Math.max(numero(estilo(ultimo).marginBottom), embrulho ? numero(estilo(elemento).marginBottom) : 0),
      fonte: numero(estilo(primeiro).fontSize),
      fonteDoBloco: numero(estilo(elemento).fontSize)
    }
  }

  // Seções na ordem em que aparecem na página.
  function secoes (editor) {
    const nomes = typeof editor.model.document.getRootNames === 'function' ? editor.model.document.getRootNames() : ['main']
    return nomes.map(nome => ({ nome, dom: editor.editing.view.getDomRoot(nome) }))
      .filter(secao => secao.dom)
      .sort((a, b) => a.dom.compareDocumentPosition(b.dom) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
  }
  const jaTem = editor => secoes(editor).some(secao => regras().temEspacamento(editor.getData({ rootName: secao.nome })))

  async function medir () {
    try {
      const editor = await ajuda().acharEditor()
      if (!editor) return { ok: false, erro: 'O editor do SEI não abriu a tempo.' }
      if (document.fonts && document.fonts.ready) await document.fonts.ready
      await esperar(800)
      if (jaTem(editor)) return { ok: true, jaTem: true }
      const blocos = []
      const outras = []
      secoes(editor).forEach((secao, indice) => {
        const nome = secao.dom.getAttribute('aria-label') || secao.nome
        ;[...secao.dom.children].forEach((filho, i) => blocos.push(medirBloco(filho, indice, nome, i + 1)))
        for (const caixa of secao.dom.querySelectorAll('div, td, th, li, blockquote, figure')) {
          if (caixa.children.length > 1) outras.push([...caixa.children].map(descritor))
        }
      })
      return { ok: true, jaTem: false, documento: { blocos, outras } }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  // Onde fica o bloco: no parágrafo do brasão (sem texto; a pessoa quase nunca mexe nele, e "Corrigir timbre"
  // o mantém); se não der, no primeiro parágrafo do corpo; se não, no primeiro de uma seção que dá para editar.
  function lugarDoBloco (editor) {
    const modelo = editor.model
    const editaveis = secoes(editor).filter(secao => secao.dom.getAttribute('contenteditable') === 'true' &&
      !(typeof editor.isRootDisabled === 'function' && editor.isRootDisabled(secao.nome)))
    const paragrafos = secao => [...modelo.createRangeIn(modelo.document.getRoot(secao.nome))]
      .map(({ item }) => item).filter(item => item.is('element', 'paragraph'))
    const semTexto = paragrafo => [...paragrafo.getChildren()].every(filho => !filho.is('$text') || !filho.data.replace(INVISIVEIS, ''))
    for (const secao of editaveis) {
      const brasao = paragrafos(secao).find(p => /^IFTO_Cabe(ç|&ccedil;)alho/i.test(p.getAttribute('estilo') || '') && semTexto(p))
      if (brasao) return brasao
    }
    const corpo = editaveis.find(secao => secao.dom.classList.contains('infra-editor__secao-principal'))
    for (const secao of [corpo, ...editaveis].filter(Boolean)) {
      const primeiro = paragrafos(secao)[0]
      if (primeiro) return primeiro
    }
    return null
  }

  async function por (bloco) {
    try {
      const editor = await ajuda().acharEditor()
      if (!editor) return { ok: false, erro: 'Não achei o editor do SEI.' }
      if (jaTem(editor)) return { ok: true, jaTinha: true }
      const alvo = lugarDoBloco(editor)
      if (!alvo) return { ok: false, erro: 'Não achei uma parte do documento que dê para editar.' }
      ajuda().porBloco(editor, alvo, bloco)
      if (!jaTem(editor)) return { ok: false, erro: 'O editor não aceitou o espaço.' }
      return { ok: true }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  async function tirar () {
    try {
      const editor = await ajuda().acharEditor()
      if (!editor) return { ok: false, erro: 'Não achei o editor do SEI.' }
      const mudancas = {}
      for (const secao of secoes(editor)) {
        const html = editor.getData({ rootName: secao.nome })
        if (regras().temEspacamento(html)) mudancas[secao.nome] = regras().tirarEspacamento(html)
      }
      if (Object.keys(mudancas).length) editor.data.set(mudancas, { batchType: { isUndoable: true } })
      return jaTem(editor) ? { ok: false, erro: 'O editor não tirou o espaço.' } : { ok: true }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { editorEspacamento: { medir, por, tirar } })
})(globalThis)
