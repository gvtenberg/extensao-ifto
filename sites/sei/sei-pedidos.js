// Conversa com o SEI sem abrir telas: pedir páginas, baixar arquivos e enviar formulários como o navegador
// faria. Saiu de documentos-pagamento.js na v0.10.0 para servir também ao SICAF automático.
(function () {
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { montarCorpo, trocarCampos } = ExtensaoIFTO.documentosPagamento

  async function responder (endereco, opcoes) {
    const resposta = await fetch(new URL(endereco, location.href).href, { credentials: 'same-origin', ...opcoes })
    if (!resposta.ok) throw new Error('O SEI não respondeu (erro ' + resposta.status + '). Tente de novo.')
    return resposta
  }

  // O SEI responde em ISO-8859-1: lê os bytes e decodifica (o .text() leria como UTF-8).
  async function pedir (endereco, corpo) {
    const resposta = await responder(endereco, {
      method: corpo ? 'POST' : 'GET',
      headers: corpo ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
      body: corpo || undefined
    })
    const conjunto = (/charset=([^;]+)/i.exec(resposta.headers.get('content-type') || '') || [])[1]
    const decodificador = /utf-?8/i.test(conjunto || '') ? 'utf-8' : 'windows-1252'
    const html = new TextDecoder(decodificador).decode(await resposta.arrayBuffer())
    return { endereco: resposta.url || endereco, html }
  }

  // v0.10.0: arquivo de um documento externo (link "documento_download_anexo" da árvore).
  async function baixar (endereco) {
    const resposta = await responder(endereco, { method: 'GET' })
    return resposta.arrayBuffer()
  }

  const lerHtml = html => new DOMParser().parseFromString(html, 'text/html')

  // Campos que o navegador enviaria ao clicar em Salvar (mesmas regras do envio de formulário).
  function camposDoFormulario (formulario) {
    const campos = []
    for (const campo of formulario.elements) {
      const nome = campo.getAttribute('name')
      if (!nome || campo.hasAttribute('disabled')) continue
      const tag = campo.tagName.toLowerCase()
      const tipo = (campo.getAttribute('type') || '').toLowerCase()
      if (tag === 'button' || ['button', 'submit', 'reset', 'image', 'file'].includes(tipo)) continue
      if (tag === 'select') {
        const opcoesDaLista = [...campo.options]
        let escolhidas = opcoesDaLista.filter(opcao => opcao.hasAttribute('selected'))
        if (!campo.multiple && !escolhidas.length && opcoesDaLista.length && !(Number(campo.getAttribute('size')) > 1)) escolhidas = [opcoesDaLista[0]]
        if (!campo.multiple) escolhidas = escolhidas.slice(-1)
        for (const opcao of escolhidas) campos.push([nome, opcao.getAttribute('value') !== null ? opcao.getAttribute('value') : opcao.textContent])
      } else if (tag === 'textarea') {
        campos.push([nome, campo.textContent])
      } else if (tipo === 'radio' || tipo === 'checkbox') {
        if (campo.hasAttribute('checked')) campos.push([nome, campo.getAttribute('value') || 'on'])
      } else {
        campos.push([nome, campo.getAttribute('value') || ''])
      }
    }
    return campos
  }
  async function enviar (formulario, enderecoDaPagina, novos) {
    const destino = new URL(formulario.getAttribute('action'), enderecoDaPagina).href
    return pedir(destino, montarCorpo(trocarCampos(camposDoFormulario(formulario), novos)))
  }

  // Árvore do processo aberto (quadro ifrArvore), com o link "Incluir Documento". null se não carregou.
  function arvoreAberta () {
    let documentoDaArvore
    try { documentoDaArvore = document.getElementById('ifrArvore').contentDocument } catch (erro) { return null }
    if (!documentoDaArvore) return null
    const texto = [...documentoDaArvore.scripts].map(script => script.textContent).join('\n')
    const lida = ExtensaoIFTO.sei.lerArvore(texto)
    lida.linkIncluir = (/<a href="(controlador\.php\?acao=documento_escolher_tipo[^"]*)"/.exec(texto) || [])[1] || null
    return lida.idProcesso ? lida : null
  }
  function recarregarArvore () {
    const quadro = document.getElementById('ifrArvore')
    try { quadro.contentWindow.location.reload() } catch (erro) { quadro.setAttribute('src', quadro.getAttribute('src')) }
  }

  ExtensaoIFTO.seiPedidos = { pedir, baixar, lerHtml, camposDoFormulario, enviar, arvoreAberta, recarregarArvore }
})()
