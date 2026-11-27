// Conversa com o SEI sem abrir telas: pedir páginas, baixar arquivos e enviar formulários como o navegador
// faria. Saiu de documentos-pagamento.js na v0.10.0 para servir também ao SICAF automático.
(function () {
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { montarCorpo, trocarCampos } = ExtensaoIFTO.documentosPagamento

  // v0.27.1 (spec base-e-sei, etapa 3): o SEI pode estar lento ou fora do ar: tempo limite em cada pedido
  // (2 minutos; o envio de arquivo, 5 minutos), com aviso simples.
  const TEMPO_LIMITE = 120000
  const TEMPO_LIMITE_ARQUIVO = 300000
  const MENSAGEM_DEMOROU = 'O SEI demorou demais para responder: ele pode estar lento ou fora do ar. Tente de novo daqui a pouco.'
  async function buscar (endereco, opcoes, limite = TEMPO_LIMITE) {
    try {
      return await fetch(endereco, { credentials: 'same-origin', signal: AbortSignal.timeout(limite), ...opcoes })
    } catch (erro) {
      if (erro && (erro.name === 'TimeoutError' || erro.name === 'AbortError')) throw new Error(MENSAGEM_DEMOROU)
      throw new Error('Não consegui falar com o SEI: ele pode estar fora do ar, ou a internet caiu. Tente de novo daqui a pouco.')
    }
  }
  async function responder (endereco, opcoes) {
    const resposta = await buscar(new URL(endereco, location.href).href, opcoes)
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
  // v0.27.1 (etapa 3 da spec base-e-sei, arquivos arrastados): item.data ("dd/mm/aaaa"; sem ela, hoje) e
  // arquivo.tipo (tipo do arquivo para o navegador; sem ele, PDF).
  const formularioDoExterno = pagina => lerHtml(pagina.html).getElementById('frmDocumentoCadastro')
  // Incluir Documento › Externo (escolher(-1) do SEI): devolve o formulário do documento externo novo (só lê:
  // nada é gravado no SEI antes do Salvar).
  async function abrirExternoNovo (lida) {
    if (!lida.linkIncluir) throw new Error('Não achei "Incluir Documento" na árvore do processo.')
    const inicio = await pedir(new URL(lida.linkIncluir.replace(/&amp;/g, '&'), location.href).href)
    const escolherTipo = lerHtml(inicio.html).getElementById('frmDocumentoEscolherTipo')
    if (!escolherTipo) throw new Error('O SEI não abriu "Incluir Documento". Confira se a sessão do SEI ainda está aberta.')
    const emBranco = await enviar(escolherTipo, inicio.endereco, { hdnIdSerie: '-1' })
    if (!formularioDoExterno(emBranco)) throw new Error('O SEI não abriu o documento externo.')
    return emBranco
  }
  // Página "Incluir Documento" do processo: tipos e formulário de cada tipo (saiu de compras-ifto.js na v0.36.0).
  async function abrirIncluir (lida) {
    if (!lida.linkIncluir) throw new Error('Não achei "Incluir Documento" na árvore do processo.')
    const inicio = await pedir(new URL(lida.linkIncluir.replace(/&amp;/g, '&'), location.href).href)
    const escolherTipo = lerHtml(inicio.html).getElementById('frmDocumentoEscolherTipo')
    if (!escolherTipo) throw new Error('O SEI não abriu "Incluir Documento". Confira se a sessão do SEI ainda está aberta.')
    return { inicio, escolherTipo, tipos: ExtensaoIFTO.comprasIfto.lerTipos(inicio.html) }
  }
  // Formulário do documento do tipo escolhido (o SEI só devolve a tela; nada é criado aqui).
  async function formularioDoTipo (incluir, idTipo) {
    const pagina = await enviar(incluir.escolherTipo, incluir.inicio.endereco, { hdnIdSerie: idTipo })
    const formulario = lerHtml(pagina.html).getElementById('frmDocumentoCadastro')
    if (!formulario) throw new Error('O SEI não abriu o formulário desse tipo de documento.')
    return { pagina, formulario }
  }
  // v0.27.1: nomes da lista "Tipo do Documento" do documento externo deste processo.
  async function tiposDoExterno (lida) {
    const lista = formularioDoExterno(await abrirExternoNovo(lida)).querySelector('#selSerie')
    return lista ? [...lista.options].filter(opcao => opcao.getAttribute('value') && opcao.getAttribute('value') !== 'null').map(opcao => opcao.textContent.trim()) : []
  }

  async function incluirExternos (lida, itens, { aoAvancar = () => {}, deveParar = () => false, incluidos = [], salvos = [] } = {}) {
    const regras = ExtensaoIFTO.documentosPagamento
    const sicaf = ExtensaoIFTO.sicaf
    // Só é pedido se algum item for novo (v0.16.0: os em branco são alterados).
    let pagina = null

    for (let posicao = 0; posicao < itens.length; posicao++) {
      if (deveParar()) return
      const { tipo, nomeArvore, arquivo, data, emBranco: existente } = itens[posicao]
      aoAvancar(posicao)
      if (existente) {
        await alterarExterno(existente, { tipo, nomeArvore, arquivo }, formularioDoExterno, regras, sicaf)
        salvos.push({ id: existente.id })
        incluidos.push(tipo)
        continue
      }
      // v0.37.0 (T275, 4 arquivos arrastados, só o 1º entrava): um formulário novo do SEI para cada documento;
      // o mesmo formulário, usado de novo depois de salvar, o SEI não aceitava.
      const paginaEmBranco = await abrirExternoNovo(lida)
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
      const novos = { hdnIdSerie: opcao.valor, selSerie: opcao.valor, txtDataElaboracao: data || ExtensaoIFTO.documentoExterno.dataDeHoje(), rdoFormato: 'N', rdoNivelAcesso: '0', hdnFlagDocumentoCadastro: '2' }
      for (const nome of ['selGrauSigilo', 'selHipoteseLegal']) {
        const listaNula = doTipo.querySelector(`select[name="${nome}"]`)
        if (listaNula && [...listaNula.options].some(item => item.getAttribute('value') === 'null')) novos[nome] = 'null'
      }
      if (nomeArvore) novos.txtNomeArvore = nomeArvore
      // v0.36.4: tipo que exige o Número: avisa antes de enviar o arquivo (o SEI não salvaria).
      if (regras.numeroObrigatorio(pagina.html)) throw new Error(`O tipo "${tipo}" exige o campo "Número" no SEI, que a extensão ainda não preenche. Inclua esse documento por "Incluir Documento › Externo".`)
      const htmlDoTipo = pagina.html
      if (arquivo) novos.hdnAnexos = await enviarArquivo(paginaDoTipo, pagina, arquivo, sicaf)
      pagina = await enviar(doTipo, pagina.endereco, novos)
      // Se o SEI devolve o formulário de novo, não salvou.
      if (formularioDoExterno(pagina)) throw new Error(regras.mensagemDoSei(pagina.html) || regras.alertaNovo(pagina.html, htmlDoTipo) || `O SEI não salvou o documento "${tipo}".`)
      // v0.36.1: para abrir o primeiro documento no fim (a resposta traz o link da árvore com ele).
      salvos.push(ExtensaoIFTO.sei.linkDaArvoreComDocumento(pagina.html))
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
    if (formularioDoExterno(resposta)) throw new Error(regras.mensagemDoSei(resposta.html) || regras.alertaNovo(resposta.html, pagina.html) || `O SEI não salvou o ${tipo} ${existente.sei}.`)
  }

  // v0.32.0: arquivo solto na página de um documento externo em branco: só anexa (tipo, data, acesso e nome
  // ficam como estão), pelo mesmo caminho do SICAF.
  async function anexarAoExterno (existente, arquivo) {
    await alterarExterno(existente, { tipo: 'documento', arquivo }, formularioDoExterno, ExtensaoIFTO.documentosPagamento, ExtensaoIFTO.sicaf)
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
    dados.append('filArquivo', new Blob([arquivo.bytes], { type: arquivo.tipo || 'application/pdf' }), arquivo.nome)
    const destino = new URL(acao, pagina.endereco).href
    const resposta = await buscar(destino, { method: 'POST', body: dados }, TEMPO_LIMITE_ARQUIVO)
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

  // v0.36.1: depois de incluir, mostra a árvore nova e abre o primeiro documento incluído, para a pessoa conferir
  // sem procurar na árvore. O link do SEI já abre a pasta e escolhe o documento; se a página dele não abrir à
  // direita, clica no nome na árvore (espera o SEI terminar a escolha que ele mesmo faz, 300 ms depois).
  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))
  async function abrirIncluido (lida, salvos) {
    const quadro = document.getElementById('ifrArvore')
    let velha = null
    try { velha = quadro.contentDocument } catch (erro) { /* só compara */ }
    const antes = lida.documentos.map(doc => doc.id)
    // O link com um documento que já existia não serve (só o de um documento novo). Se o do primeiro não veio,
    // procura na árvore nova o que não existia antes.
    const certos = salvos.map(salvo => salvo && salvo.link && antes.includes(salvo.id) ? null : salvo)
    const conhecidos = certos.every(Boolean) ? certos : certos.slice(0, 1).filter(Boolean)
    const primeiro = ExtensaoIFTO.sei.primeiroIncluido(conhecidos, antes, [])
    if (primeiro && primeiro.link) quadro.contentWindow.location.href = new URL(primeiro.link, location.href).href
    else recarregarArvore()
    await abrirNaArvoreNova(quadro, velha, lida.idProcesso, nova => primeiro || ExtensaoIFTO.sei.primeiroIncluido([], antes, nova.documentos.map(doc => doc.id)))
  }

  // Espera a árvore nova (até 20 s) e abre à direita o documento que acharAlvo(árvore nova) indicar.
  async function abrirNaArvoreNova (quadro, velha, idProcesso, acharAlvo, sempreClicar = false) {
    const fim = Date.now() + 20000
    while (Date.now() < fim) {
      await esperar(400)
      let arvore = null
      try { arvore = quadro.contentDocument } catch (erro) { continue }
      const nova = arvore && arvore !== velha && arvore.readyState === 'complete' ? arvoreAberta() : null
      if (!nova) continue
      if (nova.idProcesso !== idProcesso) return
      const alvo = acharAlvo(nova)
      if (!alvo) return
      await esperar(1000)
      const direita = document.getElementById('ifrConteudoVisualizacao')
      // sempreClicar: a direita pode ainda mostrar o documento antes de o SEI trocar pelo último da árvore.
      try { if (!sempreClicar && new URL(direita.contentWindow.location.href).searchParams.get('id_documento') === alvo.id) return } catch (erro) { /* clica */ }
      const link = quadro.contentDocument && quadro.contentDocument.getElementById('anchor' + alvo.id)
      if (link) { link.scrollIntoView({ block: 'nearest' }); link.click() }
      return
    }
  }

  // v0.37.0 (#355): depois de anexar o arquivo a um documento em branco, recarrega a árvore e abre esse mesmo
  // documento (o SEI, sozinho, abria o último da árvore, que nem sempre é o que recebeu o arquivo).
  async function abrirDepoisDeAnexar (idDocumento) {
    const quadro = document.getElementById('ifrArvore')
    let velha = null
    try { velha = quadro.contentDocument } catch (erro) { /* só compara */ }
    const lida = arvoreAberta()
    recarregarArvore()
    if (lida) await abrirNaArvoreNova(quadro, velha, lida.idProcesso, () => ({ id: String(idDocumento) }), true)
  }

  // v0.38.0 (#355, usuário, 27/11/2026): "Duplicar documento" de um documento externo: lê o "Alterar Documento
  // Externo" do original e salva um externo novo do mesmo tipo, com os mesmos dados (nome na árvore, data,
  // número, formato, remetente, interessados, classificação, observações, nível de acesso), sem o arquivo.
  // Depois abre o novo na árvore.
  async function duplicarExterno (lida, documento) {
    const regras = ExtensaoIFTO.duplicarDocumento
    const original = await pedir(new URL(documento.linkAlterar, location.href).href)
    const doOriginal = formularioDoExterno(original)
    if (!doOriginal) throw new Error(`O SEI não abriu o cadastro de ${documento.rotulo}.`)
    const copiar = regras.camposDoExterno(camposDoFormulario(doOriginal))
    if (!copiar.hdnIdSerie) throw new Error(`Não consegui ler o tipo de ${documento.rotulo}.`)
    const paginaEmBranco = await abrirExternoNovo(lida)
    const emBranco = formularioDoExterno(paginaEmBranco)
    const lista = emBranco.querySelector('#selSerie')
    if (!lista || ![...lista.options].some(opcao => opcao.getAttribute('value') === copiar.hdnIdSerie)) throw new Error(`O tipo de ${documento.rotulo} não aparece em "Incluir Documento › Externo" nesta unidade. Nada foi criado.`)
    const pagina = await enviar(emBranco, paginaEmBranco.endereco, { hdnIdSerie: copiar.hdnIdSerie, selSerie: copiar.hdnIdSerie })
    const doTipo = formularioDoExterno(pagina)
    if (!doTipo) throw new Error('O SEI não abriu o formulário do documento externo.')
    const resposta = await enviar(doTipo, pagina.endereco, { ...copiar, selSerie: copiar.hdnIdSerie, hdnAnexos: '', hdnFlagDocumentoCadastro: '2' })
    const regrasPagamento = ExtensaoIFTO.documentosPagamento
    if (formularioDoExterno(resposta)) throw new Error(regrasPagamento.mensagemDoSei(resposta.html) || regrasPagamento.alertaNovo(resposta.html, pagina.html) || 'O SEI não salvou a cópia.')
    await abrirIncluido(lida, [ExtensaoIFTO.sei.linkDaArvoreComDocumento(resposta.html)])
  }

  // v0.15.0 (saiu de sicaf.js na v0.27.1 para servir também aos arquivos arrastados): inclui os itens com a
  // janela da extensão aberta: andamento, botão Parar, árvore recarregada e o resumo no fim.
  async function incluirNaJanela (itens, aberta, nomeDoItem) {
    const { criar } = ExtensaoIFTO.janela
    const lida = arvoreAberta()
    if (!lida) { aberta.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: 'Não consegui ler a árvore do processo. Espere o processo abrir e tente de novo.' })]); return }
    const andamento = { parar: false }
    const incluidos = []
    const salvos = []
    const progresso = criar('p', { textContent: 'Incluindo…' })
    aberta.trocarConteudo([progresso])
    aberta.trocarBotoes([{ texto: 'Parar', aoClicar: () => { andamento.parar = true; progresso.textContent = 'Parando depois do documento da vez…' } }])
    let erro = null
    try {
      await incluirExternos(lida, itens, {
        incluidos,
        salvos,
        deveParar: () => andamento.parar,
        aoAvancar: posicao => { progresso.textContent = `Incluindo ${nomeDoItem(itens[posicao])} (${posicao + 1} de ${itens.length})…` }
      })
    } catch (falha) {
      erro = falha
    }
    if (incluidos.length) abrirIncluido(lida, salvos).catch(() => {})
    const feitos = incluidos.length ? 'Incluídos: ' + ExtensaoIFTO.documentosPagamento.listaEmTexto(itens.slice(0, incluidos.length).map(nomeDoItem)) + '.' : 'Nenhum documento foi incluído.'
    // v0.36.1: deu tudo certo: a janela fecha e só aparece a mensagem que some sozinha.
    if (!erro && incluidos.length === itens.length) {
      aberta.fechar()
      ExtensaoIFTO.janela.mensagemRapida(feitos)
      return
    }
    aberta.trocarConteudo([
      erro || andamento.parar ? criar('p', { className: 'aviso vermelho', textContent: erro ? erro.message : 'Inclusão parada.' }) : criar('p', { className: 'aviso verde', textContent: 'Pronto.' }),
      criar('p', { textContent: feitos })
    ])
    aberta.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }])
  }

  ExtensaoIFTO.seiPedidos = { pedir, baixar, baixarPdf, lerHtml, camposDoFormulario, enviar, incluirExternos, anexarAoExterno, tiposDoExterno, abrirIncluir, formularioDoTipo, incluirNaJanela, arvoreAberta, recarregarArvore, abrirDepoisDeAnexar, duplicarExterno }
})()
