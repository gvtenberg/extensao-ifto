// v0.24.0 (spec tabelas-editor): roda DENTRO da página do editor do SEI 5 (a parte de fundo o coloca com
// scripting.executeScript, world MAIN, junto com comum/tabelas-editor.js), porque o editor (CKEditor 5,
// window.infraEditor.editor) só é alcançável pelo JavaScript da própria página. Nunca salva nem assina.
// 1. Recortar/copiar e colar trecho com tabela na mesma janela: o trecho vai direto, sem passar pelo HTML da
//    área de transferência, e a tabela fica igual (largura, colunas, margens). Ctrl+Z desfaz.
// 2. Janela "Propriedades da tabela": quatro campos de margem em pixels e, em Alinhamento, o quarto botão
//    "Alinhar com o texto" (v0.25.1).
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

  // v0.25.1: margens que a tabela mostra hoje no editor, em pixels (o que o editor desenha: a margem do quadro
  // em volta da tabela mais a da própria tabela). Direita: só a guardada (a medida de "auto" seria o espaço
  // que sobra, e confunde); sem ela, 0. Se não der para medir, usa o que está guardado na tabela.
  function margensNaTela (editor, tabela) {
    const guardadas = margensAtuais(tabela)
    try {
      const quadro = editor.editing.view.domConverter.mapViewToDom(editor.editing.mapper.toViewElement(tabela))
      const dentro = quadro && quadro.querySelector('table')
      if (quadro) {
        const medir = (elemento, chave) => elemento ? parseFloat(getComputedStyle(elemento)[chave]) || 0 : 0
        const lado = chave => Math.round(medir(quadro, chave) + medir(dentro, chave)) + 'px'
        const direita = guardadas.direita && guardadas.direita !== 'auto' ? guardadas.direita : '0'
        return { acima: lado('marginTop'), direita, abaixo: lado('marginBottom'), esquerda: lado('marginLeft') }
      }
    } catch (erro) {}
    return guardadas
  }

  const NOMES = { acima: 'Acima', direita: 'Direita', abaixo: 'Abaixo', esquerda: 'Esquerda' }
  const PADRAO = { acima: '10', direita: '0', abaixo: '10', esquerda: '28' }
  // Desenho do botão: linhas de texto e tabela com o mesmo recuo à esquerda.
  const ICONE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M6 2h12v1.5H6zM6 16.5h12V18H6zM1.5 7.5 4 10l-2.5 2.5z"/><path fill-rule="evenodd" d="M6 5.5h12v9H6zm1.5 1.5v2.5h4V7zm5.5 0v2.5h3.5V7zm-5.5 4v2h4v-2zm5.5 0v2h3.5v-2z"/></svg>'

  // Quarto botão em "Alinhamento": deixa a tabela à esquerda e preenche as margens padrão (vale no OK).
  function botaoAlinhar (editor, formulario, preencher) {
    const barra = formulario.alignmentToolbar
    if (!barra || !barra.items || !barra.items.first || formulario.__extensaoIftoBotao) return false
    const Botao = barra.items.first.constructor
    const botao = new Botao(editor.locale)
    botao.set({ label: 'Alinhar com o texto (margens 10, 0, 10 e 28 px)', icon: ICONE, tooltip: true, isToggleable: true })
    botao.on('execute', () => {
      formulario.alignment = 'left'
      preencher(PADRAO)
    })
    barra.items.add(botao)
    formulario.__extensaoIftoBotao = botao
    return true
  }

  function montarCaixa (editor, formulario) {
    const elemento = formulario.element
    let linha = elemento.querySelector('[data-extensao-ifto="margens"]')
    if (!linha) {
      linha = document.createElement('div')
      linha.className = 'ck ck-form__row'
      linha.dataset.extensaoIfto = 'margens'
      linha.style.cssText = 'display:block;padding:0 var(--ck-spacing-large, 10px)'
      linha.innerHTML = '<label class="ck ck-label" style="display:block;margin-bottom:4px">Margens, em pixels (px) <small>(extensão IFTO)</small></label>' +
        // v0.25.1: nome em cima e campo embaixo, quatro colunas iguais que cabem na janela (o editor dá aos
        // campos uma largura mínima grande, por isso min-width:0).
        '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px">' + regras().LADOS.map(lado =>
          '<label style="display:flex;flex-direction:column;min-width:0;font-size:.9em">' +
          '<span style="display:block;margin-bottom:2px">' + NOMES[lado] + '</span>' +
          '<input type="text" inputmode="decimal" data-lado="' + lado + '" class="ck ck-input ck-input-text" style="display:block;width:100%;min-width:0;box-sizing:border-box" spellcheck="false" title="' + NOMES[lado] + ', em pixels. Padrão: ' + PADRAO[lado] + '"></label>').join('') +
        '</div>' +
        '<div style="margin-top:4px;color:#555;white-space:normal;font-size:.9em">Padrão: acima 10, direita 0, abaixo 10 e esquerda 28 (o último botão de Alinhamento preenche assim). Vale ao clicar em OK.</div>' +
        '<div data-erro style="display:none;margin-top:4px;color:#B3261E;white-space:normal"></div>'
      const linhaDosBotoes = elemento.querySelector('.ck-table-form__action-row')
      elemento.insertBefore(linha, linhaDosBotoes)
      const campos = [...linha.querySelectorAll('input[data-lado]')]
      const erro = linha.querySelector('[data-erro]')
      const marcarBotao = () => {
        const botao = formulario.__extensaoIftoBotao
        // v0.25.2: só um botão de Alinhamento marcado: o da extensão só com a tabela à esquerda e as margens padrão.
        if (botao) botao.isOn = formulario.alignment === 'left' && campos.every(campo => regras().lerPixels(campo.value) === regras().lerPixels(PADRAO[campo.dataset.lado]))
      }
      const preencher = valores => {
        for (const campo of campos) if (valores[campo.dataset.lado] !== undefined) campo.value = regras().mostrarPixels(valores[campo.dataset.lado])
        erro.style.display = 'none'
        marcarBotao()
      }
      linha.__preencher = preencher
      linha.__marcar = marcarBotao
      // Sem a barra de Alinhamento (outra versão do SEI): o botão fica abaixo dos campos, com o nome escrito.
      if (botaoAlinhar(editor, formulario, preencher)) {
        // v0.25.2: o botão "à esquerda" do SEI desmarca quando o da extensão está marcado; clicar nele tira o
        // recuo (Esquerda 0). Centralizar ou alinhar à direita volta Esquerda e Direita ao que eram, para o OK
        // não puxar a tabela de volta para a esquerda.
        const botao = formulario.__extensaoIftoBotao
        const esquerda = formulario.alignmentToolbar.items.first
        esquerda.unbind('isOn')
        esquerda.bind('isOn').to(formulario, 'alignment', botao, 'isOn', (alinhamento, nosso) => alinhamento === 'left' && !nosso)
        esquerda.on('execute', () => { if (botao.isOn) preencher({ esquerda: '0' }) })
        formulario.on('change:alignment', (evento, nome, alinhamento) => {
          if (alinhamento !== 'left') for (const campo of campos) if (campo.dataset.lado === 'esquerda' || campo.dataset.lado === 'direita') campo.value = campo.dataset.inicial
          marcarBotao()
        })
      } else {
        const reserva = document.createElement('button')
        reserva.type = 'button'
        reserva.className = 'ck ck-button ck-button_with-text'
        reserva.style.marginTop = '6px'
        reserva.innerHTML = '<span class="ck ck-button__label">Alinhar com o texto</span>'
        reserva.addEventListener('click', () => { formulario.alignment = 'left'; preencher(PADRAO) })
        linha.appendChild(reserva)
      }
      for (const campo of campos) {
        campo.addEventListener('input', () => {
          erro.style.display = 'none'
          // Quem colar o formato antigo ("margin:10px auto 10px 28px") num campo tem os quatro preenchidos.
          if (/margin|\s/.test(campo.value.trim())) {
            const coladas = regras().lerMargens(campo.value)
            if (coladas) preencher(coladas)
          }
          marcarBotao()
        })
      }
      // OK da janela: aplica só os lados que mudaram. Valor que não é número segura a janela.
      formulario.on('submit', evento => {
        const tabela = tabelaSelecionada(editor)
        if (!tabela) return
        const margens = {}
        for (const campo of campos) {
          if (campo.value.trim() === campo.dataset.inicial) continue
          const valor = regras().lerPixels(campo.value)
          if (valor === null) {
            erro.textContent = 'Use só números nas margens (em pixels). Exemplo: 28'
            erro.style.display = 'block'
            campo.focus()
            evento.stop()
            return
          }
          margens[campo.dataset.lado] = valor
        }
        if (Object.keys(margens).length) aplicarMargens(editor, tabela, margens)
      }, { priority: 'highest' })
    }
    const tabela = tabelaSelecionada(editor)
    const atuais = tabela ? margensNaTela(editor, tabela) : {}
    for (const campo of linha.querySelectorAll('input[data-lado]')) {
      campo.value = regras().mostrarPixels(atuais[campo.dataset.lado])
      campo.dataset.inicial = campo.value
    }
    linha.querySelector('[data-erro]').style.display = 'none'
    linha.__marcar()
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
