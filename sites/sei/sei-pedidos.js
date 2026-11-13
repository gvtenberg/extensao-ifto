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

  // v0.17.3: PDF de um documento da árvore. Se o SEI devolve uma página (e não o PDF), procura nela o link
  // do arquivo (documento_download_anexo) e baixa esse; se não for PDF, explica o motivo.
  const ehPdf = bytes => new TextDecoder('latin1').decode(new Uint8Array(bytes).slice(0, 1024)).includes('%PDF')
  async function baixarPdf (endereco) {
    const bytes = await baixar(endereco)
    if (ehPdf(bytes)) return bytes
    const html = new TextDecoder('windows-1252').decode(bytes)
    const dentro = (/["'](controlador\.php\?acao=documento_download_anexo[^"']*)["']/.exec(html) || [])[1]
    if (dentro) {
      const outro = await baixar(new URL(dentro.replace(/&amp;/g, '&'), new URL(endereco, location.href)).href)
      if (ehPdf(outro)) return outro
    }
    throw new Error(/pwdSenha|login\.php/i.test(html) ? 'a sessão do SEI terminou' : 'o SEI não devolveu um PDF')
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

  // Inclui documentos externos um a um, enviando os formulários do SEI direto (v0.9.0, decisão D8 da spec
  // documentos-pagamento): Incluir Documento › Externo, uma vez; depois, para cada item, escolher o tipo
  // (o SEI devolve o formulário do tipo) e Salvar com data de hoje, Nato-digital e Público.
  // v0.14.0 (SICAF automático): item { tipo, nomeArvore, arquivo: { bytes, nome } }: "Nome na Árvore" e o
  // arquivo enviado como no "Anexar Arquivo..." do SEI. aoAvancar(posição) mostra o andamento;
  // deveParar() vê se a pessoa pediu para parar; incluidos recebe o tipo de cada documento salvo.
  async function incluirExternos (lida, itens, { aoAvancar = () => {}, deveParar = () => false, incluidos = [] } = {}) {
    const regras = ExtensaoIFTO.documentosPagamento
    const sicaf = ExtensaoIFTO.sicaf
    const formularioDoExterno = pagina => lerHtml(pagina.html).getElementById('frmDocumentoCadastro')
    // Incluir Documento › Externo (escolher(-1) do SEI): devolve o formulário do documento externo novo.
    // Só é pedido se algum item for novo (v0.16.0: os em branco são alterados).
    let pagina = null
    let paginaEmBranco = null
    async function abrirExternoNovo () {
      if (!lida.linkIncluir) throw new Error('Não achei "Incluir Documento" na árvore do processo.')
      const inicio = await pedir(new URL(lida.linkIncluir.replace(/&amp;/g, '&'), location.href).href)
      const escolherTipo = lerHtml(inicio.html).getElementById('frmDocumentoEscolherTipo')
      if (!escolherTipo) throw new Error('O SEI não abriu "Incluir Documento". Confira se a sessão do SEI ainda está aberta.')
      const emBranco = await enviar(escolherTipo, inicio.endereco, { hdnIdSerie: '-1' })
      if (!formularioDoExterno(emBranco)) throw new Error('O SEI não abriu o documento externo.')
      return emBranco
    }

    for (let posicao = 0; posicao < itens.length; posicao++) {
      if (deveParar()) return
      const { tipo, nomeArvore, arquivo, emBranco: existente } = itens[posicao]
      aoAvancar(posicao)
      if (existente) {
        await alterarExterno(existente, { tipo, nomeArvore, arquivo }, formularioDoExterno, regras, sicaf)
        incluidos.push(tipo)
        continue
      }
      if (!paginaEmBranco) paginaEmBranco = await abrirExternoNovo()
      // 1º: escolher o tipo (trocarSerie() do SEI), sempre a partir do formulário em branco.
      const emBranco = formularioDoExterno(paginaEmBranco)
      const lista = emBranco.querySelector('#selSerie')
      const opcao = lista && regras.acharOpcao([...lista.options].map(item => ({ valor: item.getAttribute('value'), texto: item.textContent })), tipo)
      if (!opcao) throw new Error(`O tipo de documento "${tipo}" não aparece na lista do SEI.`)
      pagina = await enviar(emBranco, paginaEmBranco.endereco, { hdnIdSerie: opcao.valor, selSerie: opcao.valor })
      const paginaDoTipo = lerHtml(pagina.html)
      const doTipo = paginaDoTipo.getElementById('frmDocumentoCadastro')
      // O tipo ficou se o SEI devolve o formulário com ele (no campo escondido ou marcado na lista).
      const serie = doTipo && doTipo.querySelector('#hdnIdSerie')
      const marcada = doTipo && doTipo.querySelector('#selSerie option[selected]')
      if (!doTipo || ((serie && serie.getAttribute('value')) !== opcao.valor && (marcada && marcada.getAttribute('value')) !== opcao.valor)) {
        throw new Error(`O SEI não aceitou o tipo "${tipo}".`)
      }
      // 2º: Salvar (confirmarDados() do SEI) com data de hoje, Nato-digital e Público; nível público limpa
      // grau de sigilo e hipótese legal (alterarNivelAcesso() do SEI).
      const novos = { hdnIdSerie: opcao.valor, selSerie: opcao.valor, txtDataElaboracao: ExtensaoIFTO.documentoExterno.dataDeHoje(), rdoFormato: 'N', rdoNivelAcesso: '0', hdnFlagDocumentoCadastro: '2' }
      for (const nome of ['selGrauSigilo', 'selHipoteseLegal']) {
        const listaNula = doTipo.querySelector(`select[name="${nome}"]`)
        if (listaNula && [...listaNula.options].some(item => item.getAttribute('value') === 'null')) novos[nome] = 'null'
      }
      if (nomeArvore) novos.txtNomeArvore = nomeArvore
      if (arquivo) novos.hdnAnexos = await enviarArquivo(paginaDoTipo, pagina, arquivo, sicaf)
      pagina = await enviar(doTipo, pagina.endereco, novos)
      // Se o SEI devolve o formulário de novo, não salvou.
      if (formularioDoExterno(pagina)) throw new Error(regras.mensagemDoSei(pagina.html) || `O SEI não salvou o documento "${tipo}".`)
      incluidos.push(tipo)
    }
  }

  // v0.16.0: documento externo em branco que já está na árvore (Sicaf, Consulta, Anexo): abre "Alterar
  // Documento Externo" e salva só com o nome na árvore e o arquivo; o resto fica como está. Consulta em
  // branco sem nome nem arquivo: nada a mudar.
  async function alterarExterno (existente, { tipo, nomeArvore, arquivo }, formularioDoExterno, regras, sicaf) {
    if (!nomeArvore && !arquivo) return
    const pagina = await pedir(existente.linkAlterar)
    const paginaLida = lerHtml(pagina.html)
    const formulario = paginaLida.getElementById('frmDocumentoCadastro')
    if (!formulario) throw new Error(`O SEI não abriu o ${tipo} em branco (${existente.sei}) para alterar.`)
    const novos = { hdnFlagDocumentoCadastro: '2' }
    if (nomeArvore) novos.txtNomeArvore = nomeArvore
    if (arquivo) {
      const linha = await enviarArquivo(paginaLida, pagina, arquivo, sicaf)
      const campo = formulario.querySelector('#hdnAnexos')
      const atual = campo ? campo.getAttribute('value') || '' : ''
      novos.hdnAnexos = atual ? atual + '¥' + linha : linha
    }
    const resposta = await enviar(formulario, pagina.endereco, novos)
    if (formularioDoExterno(resposta)) throw new Error(regras.mensagemDoSei(resposta.html) || `O SEI não salvou o ${tipo} ${existente.sei}.`)
  }

  // v0.14.0: arquivo do documento externo, como o "Anexar Arquivo..." do SEI (formulário frmAnexos, que o
  // SEI envia num quadro escondido). Devolve a linha do campo hdnAnexos para o Salvar.
  async function enviarArquivo (paginaDoTipo, pagina, arquivo, sicaf) {
    // v0.17.3: o endereço vem do script do SEI (o formulário lido sem abrir a tela não tem; dava erro 404).
    const acao = sicaf.enderecoDoUpload(pagina.html)
    if (!paginaDoTipo.getElementById('frmAnexos') || !acao) throw new Error('O SEI não mostrou o campo do arquivo.')
    const dados = new FormData()
    // Número do andamento do envio, sorteado como o próprio SEI faz (InfraUpload.js).
    dados.append('UPLOAD_IDENTIFIER', String(Math.floor(Math.random() * 999999)))
    dados.append('filArquivo', new Blob([arquivo.bytes], { type: 'application/pdf' }), arquivo.nome)
    const destino = new URL(acao, pagina.endereco).href
    const resposta = await fetch(destino, { method: 'POST', credentials: 'same-origin', body: dados })
    if (!resposta.ok) throw new Error('O SEI não recebeu o arquivo (erro ' + resposta.status + ').')
    const upload = sicaf.lerRespostaDoUpload(new TextDecoder('windows-1252').decode(await resposta.arrayBuffer()))
    if (upload.erro) throw new Error('O SEI não aceitou o arquivo: ' + upload.erro)
    return sicaf.linhaDoAnexo(upload, sicaf.lerUsuarioDoUpload(pagina.html))
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

  ExtensaoIFTO.seiPedidos = { pedir, baixar, baixarPdf, lerHtml, camposDoFormulario, enviar, incluirExternos, arvoreAberta, recarregarArvore }
})()
