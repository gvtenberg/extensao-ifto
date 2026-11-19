// v0.29.0 (spec todos-os-estilos): roda DENTRO da página do editor do SEI 5 (a parte de fundo o coloca com
// scripting.executeScript, world MAIN, junto com comum/todos-os-estilos.js e sites/sei/editor-numeracao.js, de
// onde vêm acharEditor e porBloco). Junta à lista de estilos do editor (plugin "EstiloEditing") os estilos que o tipo de
// documento não tem, só nas partes do texto principal, com o CSS na página. Nunca salva.
(function (raiz) {
  const regras = () => raiz.ExtensaoIFTO.todosOsEstilos
  const ajuda = () => raiz.ExtensaoIFTO.editorNumeracao
  const ID_CSS = 'extensao-ifto-estilos-extras'
  let estado = null

  // CSS dos estilos extras na página do editor (o SEI só põe o dos estilos do próprio tipo).
  function porCss (extras, todos) {
    let elemento = document.getElementById(ID_CSS)
    if (!elemento) {
      elemento = document.createElement('style')
      elemento.id = ID_CSS
      document.head.append(elemento)
    }
    elemento.textContent = extras.map(extra => todos[extra.nome].join('\n')).join('\n')
  }

  // O editor abriu antes da extensão: parágrafos com classe de estilo extra (de um documento já salvo com ela)
  // ficaram sem estilo na lista. Lê de novo só as partes que têm essas classes, agora com os estilos extras.
  function lerDeNovo (editor, extras, raizes) {
    const nomes = new Set(extras.map(extra => extra.nome))
    const mudancas = {}
    for (const nome of raizes) {
      const html = editor.getData({ rootName: nome })
      const usa = [...html.matchAll(/<p\b[^>]*\bclass="([^"]*)"/g)].some(([, classes]) => classes.split(/\s+/).some(classe => nomes.has(classe)))
      if (usa) mudancas[nome] = html
    }
    if (Object.keys(mudancas).length) editor.data.set(mudancas, { batchType: { isUndoable: false } })
  }

  // R4 e R5: "★" antes do nome dos estilos extras na lista e a nota no fim. A lista do SEI é montada pelo
  // editor (só na primeira vez que abre); aqui só se muda o texto que aparece, nunca o nome do estilo.
  function marcarLista (extras) {
    const nomes = new Set(extras.map(extra => extra.nome))
    const r = regras()
    function marcar () {
      for (const lista of document.querySelectorAll('.ck-dropdown__panel .ck-list')) {
        const rotulos = [...lista.querySelectorAll('.ck-list__item .ck-button__label')]
        let temExtra = false
        for (const rotulo of rotulos) {
          const nome = rotulo.textContent.replace(r.ESTRELA, '')
          if (!nomes.has(nome)) continue
          temExtra = true
          if (!rotulo.textContent.startsWith(r.ESTRELA)) rotulo.textContent = r.ESTRELA + nome
        }
        let nota = lista.querySelector('[data-extensao-ifto="nota-estilos"]')
        if (!temExtra) { if (nota) nota.remove(); continue }
        if (!nota) {
          nota = document.createElement('li')
          nota.dataset.extensaoIfto = 'nota-estilos'
          nota.textContent = r.NOTA
          Object.assign(nota.style, { padding: '6px 10px', fontSize: '11px', color: '#555', maxWidth: '260px', whiteSpace: 'normal', borderTop: '1px solid #ddd', listStyle: 'none' })
        }
        if (lista.lastElementChild !== nota) lista.append(nota)
      }
    }
    let espera = null
    const observador = new MutationObserver(() => { clearTimeout(espera); espera = setTimeout(marcar, 30) })
    for (const barra of document.querySelectorAll('.ck-toolbar')) observador.observe(barra, { childList: true, subtree: true })
    marcar()
  }

  // R6: o documento leva um bloco de estilo escondido só com o CSS dos estilos extras em uso, para o documento
  // salvo e o PDF saírem formatados. Muda quando os estilos usados mudam; sai quando nenhum é usado.
  function estilosUsados (editor) {
    const nomes = []
    for (const nome of editor.model.document.getRootNames()) {
      for (const { item } of editor.model.createRangeIn(editor.model.document.getRoot(nome))) {
        if (item.is('element', 'paragraph') && item.hasAttribute('estilo')) nomes.push(item.getAttribute('estilo'))
      }
    }
    return nomes
  }
  function tirarBlocos (editor) {
    const r = regras()
    const modelo = editor.model
    const comBloco = modelo.document.getRootNames().filter(nome => r.temBloco(editor.getData({ rootName: nome })))
    if (!comBloco.length) return
    // Primeiro tira o elemento do bloco sem mexer no resto (o cursor fica onde está).
    modelo.change(escritor => {
      for (const nome of comBloco) {
        const achados = []
        for (const { item } of modelo.createRangeIn(modelo.document.getRoot(nome))) {
          // Só o bloco da extensão (a numeração e o espaçamento têm blocos de estilo próprios).
          if (!item.is('element') || !/style/i.test(item.name)) continue
          let html = ''
          try { html = editor.data.stringify(item) } catch (erro) { html = '' }
          if (r.temBloco(html)) achados.push(item)
        }
        for (const item of achados) escritor.remove(item)
      }
    })
    // Se o editor guarda o bloco de outro jeito, troca o texto daquela parte.
    const mudancas = {}
    for (const nome of comBloco) {
      const html = editor.getData({ rootName: nome })
      if (r.temBloco(html)) mudancas[nome] = r.tirarBloco(html)
    }
    if (Object.keys(mudancas).length) editor.data.set(mudancas, { batchType: { isUndoable: true } })
  }
  function lugarDoBloco (editor, raizes) {
    const principal = document.querySelector('.infra-editor__secao-principal')
    const ordem = principal && raizes.includes(principal.id) ? [principal.id, ...raizes] : raizes
    for (const nome of ordem) {
      if (typeof editor.isRootDisabled === 'function' && editor.isRootDisabled(nome)) continue
      for (const { item } of editor.model.createRangeIn(editor.model.document.getRoot(nome))) {
        if (item.is('element', 'paragraph')) return item
      }
    }
    return null
  }
  function atualizarBloco () {
    if (!estado) return
    const { editor, extras, todos, raizes } = estado
    const r = regras()
    const usados = r.extrasEmUso(estilosUsados(editor), extras)
    const noTexto = editor.model.document.getRootNames().map(nome => r.nomesNoBloco(editor.getData({ rootName: nome }))).filter(Boolean)
    if (noTexto.length === 1 && r.mesmosNomes(noTexto[0], usados)) return
    if (!noTexto.length && !usados.length) return
    tirarBlocos(editor)
    const bloco = r.blocoDeEstilo(usados, todos)
    const alvo = bloco && lugarDoBloco(editor, raizes)
    if (alvo) ajuda().porBloco(editor, alvo, bloco)
  }

  // aprendidos: { nome: [CSS] } guardados no navegador. Devolve os estilos do próprio editor (para aprender).
  async function preparar (aprendidos) {
    try {
      const editor = await ajuda().acharEditor()
      if (!editor) return { ok: false, erro: 'O editor do SEI não abriu a tempo.' }
      if (!editor.plugins.has('EstiloEditing')) return { ok: false, erro: 'Este editor não tem lista de estilos.' }
      const plugin = editor.plugins.get('EstiloEditing')
      const r = regras()
      const config = editor.config.get('infra.estilo') || {}
      const proprios = r.estilosDoEditor(config)
      if (estado && estado.editor === editor) return { ok: true, proprios, extras: estado.extras.length }
      const principal = document.querySelector('.infra-editor__secao-principal')
      const raizes = r.raizesDoTexto(Object.values(plugin.estilos), principal && principal.id)
        .filter(nome => editor.model.document.getRoot(nome))
      if (!raizes.length) return { ok: false, erro: 'Não achei o texto principal do documento.' }
      const todos = r.listaCompleta(aprendidos)
      const extras = r.estilosExtras(Object.keys(plugin.estilos), todos, raizes)
      for (const extra of extras) plugin.estilos[extra.nome] = extra
      porCss(extras, todos)
      lerDeNovo(editor, extras, raizes)
      marcarLista(extras)
      estado = { editor, extras, todos, raizes }
      let espera = null
      editor.model.document.on('change:data', () => { clearTimeout(espera); espera = setTimeout(atualizarBloco, 1000) })
      atualizarBloco()
      return { ok: true, proprios, extras: extras.length }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { editorEstilos: { preparar } })
})(globalThis)
