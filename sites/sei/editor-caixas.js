// v0.37.0 (spec numeracao-caixas-ocultas): roda DENTRO da página do editor do SEI 5 (a parte de fundo o coloca
// com scripting.executeScript, world MAIN, junto com comum/numeracao-digitada.js e sites/sei/editor-numeracao.js,
// de onde vem acharEditor). Acha as caixas escondidas (<div> sem atributos, "htmlDiv" no modelo do editor) que
// quebram a numeração automática e os parágrafos com número digitado à mão; tira as caixas e converte os
// números só com o clique da pessoa, no modelo do editor (um Ctrl+Z desfaz; comentários e marcas ficam).
// Nunca salva.
(function (raiz) {
  const regras = () => raiz.ExtensaoIFTO.numeracaoDigitada
  const ajuda = () => raiz.ExtensaoIFTO.editorNumeracao
  const OBJETO = '￼'
  let editorPreparado = null
  let achados = new Map()

  async function editor () {
    if (editorPreparado) return editorPreparado
    editorPreparado = await ajuda().acharEditor()
    return editorPreparado
  }

  // Partes do texto que a pessoa pode editar (o cabeçalho e a assinatura costumam ser só leitura).
  function raizesEditaveis (ed) {
    return ed.model.document.getRootNames().filter(nome => {
      if (typeof ed.isRootDisabled === 'function' && ed.isRootDisabled(nome)) return false
      const elemento = ed.editing.view.getDomRoot(nome)
      return Boolean(elemento) && elemento.getAttribute('contenteditable') === 'true' && !ed.isReadOnly
    })
  }

  function caixasQueAtrapalham (ed) {
    const r = regras()
    const caixas = []
    for (const nome of raizesEditaveis(ed)) {
      for (const { item } of ed.model.createRangeIn(ed.model.document.getRoot(nome))) {
        if (!item.is('element', 'htmlDiv')) continue
        const estilosDentro = []
        for (const { item: dentro } of ed.model.createRangeIn(item)) {
          if (dentro.is('element', 'paragraph') && dentro.hasAttribute('estilo')) estilosDentro.push(dentro.getAttribute('estilo'))
        }
        if (r.caixaQueAtrapalha({ atributos: [...item.getAttributeKeys()], estilosDentro })) caixas.push(item)
      }
    }
    return caixas
  }

  // Tira as caixas (de dentro para fora), deixando os parágrafos no mesmo lugar e com os mesmos estilos.
  function tirarCaixasCom (escritor, ed, caixas) {
    let tiradas = 0
    for (const caixa of [...caixas].reverse()) {
      const pai = caixa.parent
      if (!pai || !caixa.root || !caixa.root.rootName) continue
      const cabe = [...caixa.getChildren()].every(filho => ed.model.schema.checkChild(pai, filho))
      if (!cabe) continue
      escritor.unwrap(caixa)
      tiradas += 1
    }
    return tiradas
  }

  // Texto do parágrafo, com cada objeto (bloco de estilo, imagem, quebra de linha) como um caractere só, para as
  // posições baterem com as do modelo.
  const textoDoParagrafo = p => [...p.getChildren()].map(filho => (filho.is('$text') || filho.is('$textProxy')) ? filho.data : OBJETO).join('')
  const dentroDeTabela = p => Boolean(p.findAncestor && p.findAncestor('tableCell'))

  function numeroDoParagrafo (p) {
    const texto = textoDoParagrafo(p)
    const pular = texto.length - texto.replace(/^￼+/, '').length
    const lido = regras().lerNumeroDigitado(texto.slice(pular))
    return lido ? { ...lido, pular, resto: texto.slice(pular + lido.tamanho) } : null
  }

  // D4: o SEI só deixa cada estilo nas partes da lista dele ("permitidoEm"). Sem a lista, deixa.
  function estiloPermitido (ed, estilo, nomeDaRaiz) {
    if (!ed.plugins.has('EstiloEditing')) return true
    const item = ed.plugins.get('EstiloEditing').estilos[estilo]
    if (!item) return false
    return !Array.isArray(item.permitidoEm) || !item.permitidoEm.length || item.permitidoEm.includes(nomeDaRaiz)
  }
  function estiloNovo (ed, nivel, nomeDaRaiz) {
    const r = regras()
    for (const familia of ['nivel', 'edital']) {
      const estilo = r.estiloPara(nivel, familia)
      if (estilo && estiloPermitido(ed, estilo, nomeDaRaiz)) return { estilo, familia }
    }
    return { estilo: '', familia: '' }
  }

  // Lista os parágrafos com número digitado e o número que a numeração automática vai mostrar depois.
  function listarCom (ed) {
    const r = regras()
    achados = new Map()
    const lista = []
    for (const nomeDaRaiz of raizesEditaveis(ed)) {
      const niveis = []
      const daRaiz = []
      for (const { item } of ed.model.createRangeIn(ed.model.document.getRoot(nomeDaRaiz))) {
        if (!item.is('element', 'paragraph')) continue
        const estilo = item.getAttribute('estilo')
        const nivel = r.nivelDoEstilo(estilo)
        if (nivel !== null) { niveis.push(nivel); continue }
        const lido = !r.ehNumerado(estilo) && !dentroDeTabela(item) ? numeroDoParagrafo(item) : null
        if (!lido) { niveis.push(null); continue }
        const novo = estiloNovo(ed, lido.nivel, nomeDaRaiz)
        daRaiz.push({ posicao: niveis.length, item, lido, novo })
        niveis.push(novo.estilo ? lido.nivel : null)
      }
      const numeros = r.numerar(niveis)
      for (const { posicao, item, lido, novo } of daRaiz) {
        const id = 'n' + (achados.size + 1)
        achados.set(id, { item, numero: lido.numero })
        lista.push({
          id,
          numero: lido.numero,
          texto: lido.resto.replace(/￼/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70),
          estilo: novo.estilo,
          familia: novo.familia,
          ficara: numeros[posicao]
        })
      }
    }
    return lista
  }

  function contar (ed) {
    return { caixas: caixasQueAtrapalham(ed).length, digitados: listarCom(ed).filter(item => item.estilo).length }
  }

  function avisar (resultado) {
    raiz.postMessage({ extensaoIftoCaixas: true, ...resultado }, raiz.location.origin)
  }

  async function preparar () {
    try {
      const ed = await editor()
      if (!ed) return { ok: false, erro: 'O editor do SEI não abriu a tempo.' }
      if (!ed.__extensaoIftoCaixas) {
        ed.__extensaoIftoCaixas = true
        let espera = null
        ed.model.document.on('change:data', () => {
          clearTimeout(espera)
          espera = setTimeout(() => { try { avisar(contar(ed)) } catch (erro) { console.warn('extensao-ifto: numeração', erro) } }, 1500)
        })
      }
      const resultado = contar(ed)
      avisar(resultado)
      return { ok: true, erro: '', ...resultado }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  async function tirar () {
    try {
      const ed = await editor()
      if (!ed) return { ok: false, erro: 'Não achei o editor do SEI.' }
      const caixas = caixasQueAtrapalham(ed)
      let tiradas = 0
      ed.model.change(escritor => { tiradas = tirarCaixasCom(escritor, ed, caixas) })
      if (caixas.length && !tiradas) return { ok: false, erro: 'O editor não deixou tirar o texto das caixas.' }
      return { ok: true, erro: '', tiradas, ...contar(ed) }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  async function listar () {
    try {
      const ed = await editor()
      if (!ed) return { ok: false, erro: 'Não achei o editor do SEI.' }
      return { ok: true, erro: '', caixas: caixasQueAtrapalham(ed).length, itens: listarCom(ed) }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  // Leva o editor até o parágrafo e o destaca por um instante (um contorno por cima, sem mexer no texto).
  async function irPara (id) {
    try {
      const ed = await editor()
      const achado = achados.get(id)
      if (!ed || !achado || !achado.item.root || !achado.item.root.rootName) return { ok: false, erro: 'Esse parágrafo não está mais no texto.' }
      const vista = ed.editing.mapper.toViewElement(achado.item)
      const elemento = vista && ed.editing.view.domConverter.mapViewToDom(vista)
      if (!elemento) return { ok: false, erro: 'Não achei o parágrafo na tela.' }
      elemento.scrollIntoView({ block: 'center' })
      await new Promise(resolve => setTimeout(resolve, 350))
      const lugar = elemento.getBoundingClientRect()
      const marca = document.createElement('div')
      marca.style.cssText = `position:fixed;left:${lugar.left - 4}px;top:${lugar.top - 3}px;width:${lugar.width + 8}px;height:${lugar.height + 6}px;` +
        'border:3px solid #E8A33D;border-radius:4px;background:rgba(232,163,61,.12);pointer-events:none;z-index:99999;'
      document.body.append(marca)
      setTimeout(() => marca.remove(), 2500)
      return { ok: true, erro: '' }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  // Converte os parágrafos marcados: tira as caixas escondidas (sem isso a numeração sai errada), tira o número
  // digitado e os espaços depois dele e põe o estilo numerado. Tudo numa mudança só (um Ctrl+Z desfaz).
  async function converter (ids) {
    try {
      const ed = await editor()
      if (!ed) return { ok: false, erro: 'Não achei o editor do SEI.' }
      const lista = listarCom(ed)
      const porNumero = new Map(lista.map(item => [item.id, item]))
      const escolhidos = (ids || []).map(id => ({ ...achados.get(id), ...porNumero.get(id) })).filter(item => item.item && item.estilo)
      let convertidos = 0
      let tiradas = 0
      ed.model.change(escritor => {
        tiradas = tirarCaixasCom(escritor, ed, caixasQueAtrapalham(ed))
        for (const { item, estilo } of escolhidos) {
          const lido = numeroDoParagrafo(item)
          if (!lido) continue
          escritor.remove(escritor.createRange(escritor.createPositionAt(item, lido.pular), escritor.createPositionAt(item, lido.pular + lido.tamanho)))
          escritor.removeAttribute('isLegacy', item)
          escritor.setAttribute('estilo', estilo, item)
          convertidos += 1
        }
      })
      return { ok: true, erro: '', convertidos, tiradas, edital: escolhidos.filter(item => item.familia === 'edital').length, ...contar(ed) }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { editorCaixas: { preparar, tirar, listar, irPara, converter } })
})(globalThis)
