// v0.38.0 (#355): roda DENTRO da página do editor do SEI 5 (a parte de fundo o coloca com executeScript,
// world MAIN, junto com sites/sei/editor-numeracao.js, de onde vem acharEditor). Nunca salva.
(function (raiz) {
  if (raiz.ExtensaoIFTO && raiz.ExtensaoIFTO.editorDigitacao) return
  const preparados = new WeakSet()

  // 1) "R$" do SEI (valor por extenso): o texto novo sai sem negrito. A formatação do valor escolhido (lida
  // antes do comando) vai para todo texto que o comando inserir.
  function valorPorExtenso (editor) {
    const model = editor.model
    const nomes = [...editor.commands.names()].filter(nome => /extenso/i.test(nome))
    if (!nomes.length) console.warn('[extensão IFTO] Não achei o comando do valor por extenso no editor.')
    let formato = null
    for (const nome of nomes) {
      const comando = editor.commands.get(nome)
      comando.on('execute', () => { formato = [...model.document.selection.getAttributes()] }, { priority: 'highest' })
      comando.on('execute', () => { formato = null }, { priority: 'lowest' })
    }
    model.document.registerPostFixer(escritor => {
      if (!formato || !formato.length) return false
      let mudou = false
      for (const mudanca of model.document.differ.getChanges()) {
        if (mudanca.type !== 'insert' || mudanca.name !== '$text') continue
        const trecho = escritor.createRange(mudanca.position, mudanca.position.getShiftedBy(mudanca.length))
        for (const [chave, valor] of formato) {
          if (!model.schema.checkAttributeInSelection(model.createSelection(trecho), chave)) continue
          for (const item of trecho.getItems()) {
            if (item.getAttribute(chave) === valor) continue
            escritor.setAttribute(chave, valor, item)
            mudou = true
          }
        }
      }
      return mudou
    })
  }

  // 2) Enter numa linha em branco: a linha nova perdia o estilo e a formatação. Ela recebe os da linha em
  // branco (que guarda a formatação de onde veio). Itens de lista ficam como o editor faz.
  function linhaEmBranco (editor) {
    const model = editor.model
    const comando = editor.commands.get('enter')
    if (!comando) return
    let antes = null
    comando.on('execute', () => {
      const bloco = model.document.selection.getFirstPosition().parent
      antes = bloco && bloco.is('element') && bloco.isEmpty && !bloco.hasAttribute('listItemId')
        ? { nome: bloco.name, atributos: [...bloco.getAttributes()], texto: [...model.document.selection.getAttributes()] }
        : null
    }, { priority: 'highest' })
    comando.on('execute', () => {
      const guardado = antes
      antes = null
      if (!guardado) return
      const novo = model.document.selection.getFirstPosition().parent
      if (!novo || !novo.is('element') || novo.hasAttribute('listItemId')) return
      model.change(escritor => {
        if (novo.name !== guardado.nome && model.schema.checkChild(escritor.createPositionBefore(novo), guardado.nome)) escritor.rename(novo, guardado.nome)
        for (const [chave, valor] of guardado.atributos) {
          if (novo.hasAttribute(chave) || /^list/.test(chave)) continue
          if (chave.startsWith('selection:') || model.schema.checkAttribute(novo, chave)) escritor.setAttribute(chave, valor, novo)
        }
        for (const [chave, valor] of guardado.texto) if (!model.document.selection.hasAttribute(chave)) escritor.setSelectionAttribute(chave, valor)
      })
    }, { priority: 'lowest' })
  }

  // 3) Lista de estilos: abre rolada até o estilo da linha onde está o cursor e com ele marcado (como na
  // versão anterior do SEI).
  function listaDeEstilos (editor) {
    const estiloAtual = () => {
      const bloco = [...editor.model.document.selection.getSelectedBlocks()][0]
      return bloco && bloco.getAttribute('estilo')
    }
    const semEstrela = texto => String(texto || '').replace(/^★\s*/, '').trim()
    const marcar = () => {
      const atual = estiloAtual()
      if (!atual) return
      for (const painel of document.querySelectorAll('.ck-dropdown__panel.ck-dropdown__panel-visible')) {
        const botoes = [...painel.querySelectorAll('.ck-list__item .ck-button')]
        const certo = botoes.find(botao => semEstrela(botao.textContent) === atual)
        if (!certo) continue
        for (const botao of botoes) botao.classList.toggle('ck-on', botao === certo)
        certo.scrollIntoView({ block: 'center' })
      }
    }
    document.addEventListener('click', evento => {
      if (evento.target.closest && evento.target.closest('.ck-dropdown__button')) setTimeout(marcar, 60)
    }, true)
  }

  async function preparar () {
    try {
      const editor = await raiz.ExtensaoIFTO.editorNumeracao.acharEditor()
      if (!editor) return { ok: false, erro: 'O editor do SEI não abriu a tempo.' }
      if (preparados.has(editor)) return { ok: true }
      preparados.add(editor)
      valorPorExtenso(editor)
      linhaEmBranco(editor)
      listaDeEstilos(editor)
      return { ok: true }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { editorDigitacao: { preparar } })
})(globalThis)
