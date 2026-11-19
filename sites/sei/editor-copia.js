// v0.31.0 (spec copia-editor-sei): parte da cópia automática que roda dentro da página do editor do SEI
// (scripting.executeScript, world MAIN: o editor só é alcançável pelo JavaScript da própria página).
// Lê o texto e os comentários como o SEI os envia ao salvar (getFullData + Comentario) e recarrega o editor
// como na recuperação do documento 3384558 (destroy + montar). NUNCA salva: a pessoa clica em Salvar.
(function (raiz) {
  if (raiz.ExtensaoIFTO && raiz.ExtensaoIFTO.editorCopia) return
  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))
  const estado = { editor: null, versaoModelo: -1, comentarios: '', vigiado: null }

  async function acharEditor () {
    const limite = Date.now() + 30000
    while (Date.now() < limite) {
      const infra = raiz.infraEditor
      if (infra && infra.editor && infra.editor.model && typeof infra.editor.getFullData === 'function') return infra.editor
      await esperar(300)
    }
    return null
  }

  // Seções que a pessoa escreve (as de leitura, como título e número do processo, ficam as do SEI).
  const editaveis = editor => editor.model.document.getRoots()
    .filter(r => r.rootName !== '$graveyard' && !r.getAttribute('somenteLeitura')).map(r => r.rootName)

  // Versão do documento no SEI: muda a cada "Salvar" que deu certo.
  function versaoSei (editor) {
    for (const item of editor.plugins) {
      const plugin = Array.isArray(item) ? item[1] : item
      if (plugin && typeof plugin === 'object' && '_versaoDocumento' in plugin) return String(plugin._versaoDocumento || '')
    }
    return String(editor.config.get('sei.versao') || '')
  }

  // Avisa a parte da extensão quando a pessoa clica em Salvar ("salvando") e quando o SEI confirmou ("salvou").
  function vigiar (editor) {
    if (estado.vigiado === editor) return
    estado.vigiado = editor
    editor.on('salvar', evento => {
      const antes = versaoSei(editor)
      document.dispatchEvent(new CustomEvent('extensao-ifto-salvando'))
      Promise.resolve(evento.return).then(() => {
        const depois = versaoSei(editor)
        if (depois && depois !== antes) document.dispatchEvent(new CustomEvent('extensao-ifto-salvou', { detail: depois }))
      }, () => {})
    }, { priority: 'low' })
  }

  // Lê o texto e os comentários. Com "desde", devolve { mudou: false } se nada mudou desde a última leitura.
  async function ler (desde) {
    try {
      const editor = await acharEditor()
      if (!editor) return { ok: false, erro: 'O editor do SEI não abriu a tempo.' }
      vigiar(editor)
      const comentarios = editor.plugins.has('Comentario') ? (editor.plugins.get('Comentario').getData().itens || []) : []
      const marca = JSON.stringify(comentarios)
      const versaoModelo = editor.model.document.version
      // Só a leitura da cópia automática ("desde") marca o que já foi guardado; as outras leituras não contam.
      if (desde) {
        const igual = estado.editor === editor && versaoModelo === estado.versaoModelo && marca === estado.comentarios
        Object.assign(estado, { editor, versaoModelo, comentarios: marca })
        if (igual) return { ok: true, mudou: false, versaoSei: versaoSei(editor) }
      }
      const todas = editor.getFullData() || {}
      const secoes = {}
      for (const nome of editaveis(editor)) secoes[nome] = typeof todas[nome] === 'string' ? todas[nome] : editor.getData({ rootName: nome })
      return { ok: true, mudou: true, versaoSei: versaoSei(editor), secoes, comentarios }
    } catch (erro) {
      return { ok: false, erro: erro.message }
    }
  }

  // Recarrega o editor com o texto e os comentários dados, como se viessem do SEI (nada é salvo aqui).
  async function montar (secoes, comentarios) {
    try {
      const infra = raiz.infraEditor
      const editor = await acharEditor()
      if (!editor || typeof infra.montar !== 'function') return { ok: false, erro: 'Não achei o editor do SEI.' }
      const nomes = editaveis(editor)
      const usar = {}
      for (const nome of nomes) if (typeof (secoes || {})[nome] === 'string') usar[nome] = secoes[nome]
      if (!Object.keys(usar).length) return { ok: false, erro: 'A cópia não tem o texto deste documento.' }
      const itens = (comentarios || []).map(c => ({ ...c, visivel: true, podeEditar: true }))
      // O que está no editor agora: se o editor não aceitar a cópia, volta com este texto (nada se perde).
      const todas = editor.getFullData() || {}
      const antes = {}
      for (const nome of nomes) if (typeof todas[nome] === 'string') antes[nome] = todas[nome]
      const itensAntes = (editor.plugins.has('Comentario') ? (editor.plugins.get('Comentario').getData().itens || []) : []).map(c => ({ ...c, visivel: true, podeEditar: true }))
      await Promise.all((infra.editores || []).map(([, e]) => e.destroy()))
      infra.editores = []
      try {
        await infra.montar({ initialData: usar, infra: { comentario: { itens } } })
      } catch (erro) {
        await Promise.all((infra.editores || []).map(([, e]) => e.destroy().catch(() => {})))
        infra.editores = []
        await infra.montar({ initialData: antes, infra: { comentario: { itens: itensAntes } } })
        estado.editor = null
        vigiar(infra.editor)
        return { ok: false, erro: 'O editor não aceitou a cópia (o texto anterior continua no editor): ' + erro.message }
      }
      const novo = infra.editor
      try {
        for (const c of novo.plugins.get('ComentarioEditing').constructor.comments.values()) {
          c.isContentDifferent = false
          delete c.updatedContentHash
        }
      } catch (erro) {}
      estado.editor = null
      vigiar(novo)
      return { ok: true, erro: '', secoes: Object.keys(usar).length, total: nomes.length }
    } catch (erro) {
      return { ok: false, erro: 'O editor não aceitou a cópia: ' + erro.message }
    }
  }

  raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { editorCopia: { ler, montar } })
})(globalThis)
