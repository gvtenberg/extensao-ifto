// v0.22.0 (spec minuta-edital): funções levadas pela parte de fundo para a janela do editor do SEI
// (scripting.executeScript, world MAIN: o editor só é alcançável pelo JavaScript da própria página).
// Servem ao CKEditor 5 do SEI 5 (window.infraEditor.editor) e ao CKEditor 4 do SEI 4. Precisam ser funções
// inteiras, sem usar nada de fora (o navegador as copia para a página). NUNCA salvam nem assinam: a pessoa
// confere o texto e clica em Salvar.

// Lê o texto de cada seção do editor. Devolve { ok, erro, secoes: [{ nome, html, editavel }] }.
async function extensaoIftoLerEditor () {
  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))
  const limite = Date.now() + 30000
  while (Date.now() < limite) {
    const infra = window.infraEditor
    const ck5 = infra && infra.editor && infra.editor.model && infra.editor.editing ? infra.editor : null
    if (ck5) {
      const nomes = typeof ck5.model.document.getRootNames === 'function' ? ck5.model.document.getRootNames() : ['main']
      const secoes = nomes.map(nome => {
        const elemento = ck5.editing.view.getDomRoot(nome)
        const desligada = typeof ck5.isRootDisabled === 'function' ? ck5.isRootDisabled(nome) : false
        const editavel = Boolean(elemento) && elemento.getAttribute('contenteditable') === 'true' && !desligada && !ck5.isReadOnly
        return { nome, html: ck5.getData({ rootName: nome }) || '', editavel }
      })
      return { ok: true, erro: '', secoes }
    }
    if (window.CKEDITOR && window.CKEDITOR.instances) {
      const lista = Object.values(window.CKEDITOR.instances)
      if (lista.length && lista.every(instancia => instancia.status === 'ready')) {
        return { ok: true, erro: '', secoes: lista.map(instancia => ({ nome: instancia.name, html: instancia.getData() || '', editavel: !instancia.readOnly })) }
      }
    }
    await esperar(300)
  }
  return { ok: false, erro: 'O editor do SEI não abriu a tempo.', secoes: [] }
}

// Põe o texto novo nas seções dadas ({ nomeDaSecao: html }). Devolve { ok, erro }.
async function extensaoIftoGravarEditor (mudancas) {
  try {
    const infra = window.infraEditor
    const ck5 = infra && infra.editor && infra.editor.model ? infra.editor : null
    if (ck5) {
      // isUndoable: a pessoa pode desfazer com Ctrl+Z (versões antigas do editor ignoram a opção).
      ck5.data.set(mudancas, { batchType: { isUndoable: true } })
    } else if (window.CKEDITOR && window.CKEDITOR.instances) {
      for (const [nome, html] of Object.entries(mudancas)) {
        const instancia = window.CKEDITOR.instances[nome]
        if (instancia) await new Promise(resolve => instancia.setData(html, { callback: resolve }))
      }
    } else {
      return { ok: false, erro: 'Não achei o editor do SEI.' }
    }
    return { ok: true, erro: '' }
  } catch (erro) {
    return { ok: false, erro: 'O editor não aceitou o texto: ' + erro.message }
  }
}
globalThis.ExtensaoIFTO = Object.assign(globalThis.ExtensaoIFTO || {}, { editorLer: extensaoIftoLerEditor, editorGravar: extensaoIftoGravarEditor })
