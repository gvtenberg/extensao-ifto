// v0.24.0 (spec tabelas-editor): roda DENTRO da página do editor do SEI 5 (a parte de fundo o coloca com
// scripting.executeScript, world MAIN, junto com comum/tabelas-editor.js), porque o editor (CKEditor 5,
// window.infraEditor.editor) só é alcançável pelo JavaScript da própria página. Nunca salva nem assina.
// 1. Recortar/copiar e colar trecho com tabela na mesma janela: o trecho vai direto, sem passar pelo HTML da
//    área de transferência, e a tabela fica igual (largura, colunas, margens). Ctrl+Z desfaz.
// 2. Janela "Propriedades da tabela": caixa "Margens" (formato antigo) e botão "Alinhar com o texto".
(function (raiz) {
  const TIPO = 'application/x-extensao-ifto-trecho'
  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))
  const regras = () => raiz.ExtensaoIFTO.tabelasEditor

  async function acharEditor () {
    const limite = Date.now() + 30000
    while (Date.now() < limite) {
      const infra = raiz.infraEditor
      const editor = infra && infra.editor
      if (editor && editor.model && editor.editing && editor.plugins) return editor
      await esperar(300)
    }
    return null
  }

  // Cópia de um pedaço do modelo do editor (o original pode ser colado de novo depois).
  function clonar (escritor, fragmento) {
    const novo = escritor.createDocumentFragment()
    for (const filho of fragmento.getChildren()) {
      escritor.append(filho.is('$text') ? escritor.createText(filho.data, filho.getAttributes()) : escritor.cloneElement(filho, true), novo)
    }
    return novo
  }

  function temTabela (modelo, fragmento) {
    for (const { item } of modelo.createRangeIn(fragmento)) if (item.is('element', 'table')) return true
    return false
  }

  function prepararMover (editor) {
    const modelo = editor.model
    const vista = editor.editing.view.document
    let guardado = null
    let comShift = false
    // Ctrl+Shift+V (colar sem formatação) continua com o SEI.
    vista.on('keydown', (evento, dados) => { comShift = Boolean(dados.shiftKey) }, { priority: 'highest' })
    editor.plugins.get('ClipboardPipeline').on('outputTransformation', (evento, dados) => {
      guardado = null
      if ((dados.method !== 'copy' && dados.method !== 'cut') || !dados.content || !temTabela(modelo, dados.content)) return
      const id = Date.now() + '-' + Math.random()
      modelo.change(escritor => { guardado = { id, fragmento: clonar(escritor, dados.content) } })
      dados.dataTransfer.setData(TIPO, id)
    }, { priority: 'highest' })
    vista.on('clipboardInput', (evento, dados) => {
      if (!guardado || dados.method !== 'paste' || dados.content || comShift) return
      if (dados.dataTransfer.getData(TIPO) !== guardado.id) return
      if (editor.isReadOnly || !modelo.canEditAt(modelo.document.selection)) return
      evento.stop()
      modelo.change(escritor => { modelo.insertContent(clonar(escritor, guardado.fragmento), modelo.document.selection) })
      editor.editing.view.scrollToTheSelection()
    }, { priority: 'highest' })
  }

  function tabelaSelecionada (editor) {
    const selecao = editor.model.document.selection
    const elemento = selecao.getSelectedElement()
    if (elemento && elemento.is('element', 'table')) return elemento
    const posicao = selecao.getFirstPosition()
    return posicao ? posicao.findAncestor('table') : null
  }

  // Margens que a tabela tem hoje (recuo à esquerda do SEI + estilos guardados pelo editor).
  function margensAtuais (tabela) {
    const estilos = (tabela.getAttribute('htmlTableAttributes') || {}).styles || {}
    const recuo = tabela.getAttribute('recuo')
    const alinhamento = tabela.getAttribute('tableAlignment')
    if (!recuo && !estilos['margin-top'] && !estilos['margin-right'] && !estilos['margin-bottom']) return {}
    return {
      acima: estilos['margin-top'],
      direita: estilos['margin-right'] || (alinhamento === 'right' ? '0' : 'auto'),
      abaixo: estilos['margin-bottom'],
      esquerda: recuo || (alinhamento === 'left' ? '0' : 'auto')
    }
  }

  function aplicarMargens (editor, tabela, margens) {
    editor.model.change(escritor => {
      const atributos = tabela.getAttribute('htmlTableAttributes') || {}
      const estilos = Object.assign({}, atributos.styles)
      for (const [lado, chave] of [['acima', 'margin-top'], ['direita', 'margin-right'], ['abaixo', 'margin-bottom']]) {
        if (!(lado in margens)) continue
        // Direita "auto" é o normal da tabela alinhada à esquerda: não precisa guardar.
        if (margens[lado] === 'auto') delete estilos[chave]
        else estilos[chave] = margens[lado]
      }
      delete estilos['margin-left']
      escritor.setAttribute('htmlTableAttributes', Object.assign({}, atributos, { styles: estilos }), tabela)
      if ('esquerda' in margens) {
        if (margens.esquerda === 'auto') {
          escritor.removeAttribute('recuo', tabela)
          escritor.setAttribute('tableAlignment', margens.direita === 'auto' ? 'center' : 'right', tabela)
        } else {
          if (margens.esquerda === '0') escritor.removeAttribute('recuo', tabela)
          else escritor.setAttribute('recuo', margens.esquerda, tabela)
          escritor.setAttribute('tableAlignment', 'left', tabela)
        }
      }
    })
    editor.editing.reconvertItem(tabela)
  }

  function montarCaixa (editor, formulario) {
    const elemento = formulario.element
    let linha = elemento.querySelector('[data-extensao-ifto="margens"]')
    if (!linha) {
      linha = document.createElement('div')
      linha.className = 'ck ck-form__row'
      linha.dataset.extensaoIfto = 'margens'
      linha.style.cssText = 'display:block;padding:0 var(--ck-spacing-large, 10px)'
      linha.innerHTML = '<label class="ck ck-label" style="display:block;margin-bottom:4px">Margens <small>(extensão IFTO)</small></label>' +
        '<input type="text" class="ck ck-input ck-input-text" style="width:100%;box-sizing:border-box" placeholder="margin:10px auto 10px 28px" spellcheck="false">' +
        '<div style="margin-top:4px;color:#555;white-space:normal;font-size:.9em">Acima, direita, abaixo e esquerda, como no SEI antigo. A largura fica no campo Largura.</div>' +
        '<div data-erro style="display:none;margin-top:4px;color:#B3261E;white-space:normal"></div>' +
        '<button type="button" class="ck ck-button" style="margin-top:6px"><span class="ck ck-button__label">Alinhar com o texto</span></button>'
      const linhaDosBotoes = elemento.querySelector('.ck-table-form__action-row')
      elemento.insertBefore(linha, linhaDosBotoes)
      const campo = linha.querySelector('input')
      linha.querySelector('button').addEventListener('click', () => {
        campo.value = regras().escreverMargens(regras().ALINHADA_AO_TEXTO)
        campo.dispatchEvent(new Event('input'))
      })
      campo.addEventListener('input', () => { linha.querySelector('[data-erro]').style.display = 'none' })
      // OK da janela: aplica as margens se a caixa mudou. Texto que não deu para entender segura a janela.
      formulario.on('submit', evento => {
        const tabela = tabelaSelecionada(editor)
        const texto = campo.value.trim()
        if (!tabela || texto === linha.dataset.inicial) return
        const margens = regras().lerMargens(texto)
        if (!margens) {
          const erro = linha.querySelector('[data-erro]')
          erro.textContent = 'Não entendi as margens. Exemplo: margin:10px auto 10px 28px'
          erro.style.display = 'block'
          evento.stop()
          return
        }
        aplicarMargens(editor, tabela, margens)
      }, { priority: 'highest' })
    }
    const tabela = tabelaSelecionada(editor)
    const campo = linha.querySelector('input')
    campo.value = tabela ? regras().escreverMargens(margensAtuais(tabela)) : ''
    linha.dataset.inicial = campo.value
    linha.querySelector('[data-erro]').style.display = 'none'
  }

  function prepararMargens (editor) {
    if (!editor.plugins.has('ContextualBalloon')) return
    editor.plugins.get('ContextualBalloon').on('change:visibleView', (evento, nome, visivel) => {
      if (visivel && visivel.element && visivel.element.classList.contains('ck-table-properties-form')) montarCaixa(editor, visivel)
    })
  }

  async function preparar (opcoes) {
    try {
      const editor = await acharEditor()
      if (!editor) return { ok: false, erro: 'O editor do SEI não abriu a tempo.' }
      const feito = editor.__extensaoIftoTabelas || (editor.__extensaoIftoTabelas = {})
      if (opcoes.mover && !feito.mover && editor.plugins.has('ClipboardPipeline')) { prepararMover(editor); feito.mover = true }
      if (opcoes.margens && !feito.margens) { prepararMargens(editor); feito.margens = true }
      return { ok: true, erro: '' }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { editorTabelas: { preparar, margensAtuais, aplicarMargens } })
})(globalThis)
