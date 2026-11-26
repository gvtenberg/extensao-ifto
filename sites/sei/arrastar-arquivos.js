// v0.27.1 (spec base-e-sei, etapa 3): arrastar arquivos do computador para a árvore do processo. Cada arquivo
// vira um documento externo; antes, a lista para conferir o tipo, o Nome na Árvore e o tamanho de cada um.
// Nada vai para o SEI antes do clique em "Incluir" (a gravação usa o mesmo caminho do SICAF:
// seiPedidos.incluirNaJanela). Tipo: pelo nome do arquivo, regras da pessoa e tipo padrão (D14); sem
// nenhum, a pessoa escolhe na lista.
(async function () {
  // v0.28.0 (spec aviso-versao-sei): a pessoa desativou a extensão nesta versão do SEI.
  if (!(await globalThis.ExtensaoIFTO.sei.ligadaNoSei())) return
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { configuracoes, seiPedidos, janela, documentoExterno: regras } = ExtensaoIFTO
  const quadroArvore = document.getElementById('ifrArvore')
  if (!quadroArvore || !janela || !seiPedidos) return
  const { criar } = janela
  let opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.arrastarArquivos) return
  let aberta = null
  let alvoGuardado // v0.32.0: documento em branco aberto à direita (undefined = ler de novo)

  // A árvore é um quadro que o SEI recarrega: liga de novo a cada carga.
  quadroArvore.addEventListener('load', ligar)
  ligar()

  function ligar () {
    let doc
    try { doc = quadroArvore.contentDocument } catch (erro) { return }
    if (!doc || !doc.body || doc.body.dataset.extensaoIftoArrastar) return
    doc.body.dataset.extensaoIftoArrastar = 'sim'
    alvoGuardado = undefined
    ligarSoltura(doc, 'Solte aqui para incluir os arquivos neste processo (você confere antes)', () => true, abrirLista)
  }

  // Área de soltar arquivos num documento da página (v0.32.0: serve à árvore e ao documento em branco).
  // podeSoltar() diz se este lugar aceita os arquivos agora; se não, o navegador faz o de sempre.
  // v0.36.1: com o arquivo em cima, o navegador avisa sem parar (dragover). Quando os avisos param (o arquivo foi
  // para outra parte da tela, onde a saída nem sempre é avisada), a área some sozinha; e tem botão de fechar.
  const SEM_ARQUIVO_MS = 900
  function ligarSoltura (doc, texto, podeSoltar, aoSoltar) {
    let aviso = null
    let relogio = null
    let fechada = false // fechada no botão: só volta quando outro arquivo for arrastado
    const temArquivos = evento => evento.dataTransfer && [...evento.dataTransfer.types].includes('Files')
    const esconder = () => {
      if (aviso) aviso.remove()
      aviso = null
    }
    const saiu = () => { clearTimeout(relogio); relogio = null; esconder(); fechada = false }
    const mostrar = () => {
      if (aviso || fechada) return
      aviso = doc.createElement('div')
      aviso.dataset.extensaoIfto = 'soltar'
      aviso.textContent = texto
      Object.assign(aviso.style, {
        position: 'fixed', inset: '4px', zIndex: '2147483000', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '12px', border: '3px dashed #1E5E33', borderRadius: '10px', background: 'rgba(231,242,234,.92)',
        color: '#1E5E33', font: '600 14px/1.4 system-ui, sans-serif', pointerEvents: 'none'
      })
      const fechar = doc.createElement('button')
      fechar.type = 'button'
      fechar.textContent = '× Fechar'
      Object.assign(fechar.style, {
        position: 'absolute', top: '6px', right: '6px', padding: '4px 10px', border: '1px solid #1E5E33', borderRadius: '6px',
        background: '#fff', color: '#1E5E33', font: '600 13px/1.4 system-ui, sans-serif', cursor: 'pointer', pointerEvents: 'auto'
      })
      fechar.addEventListener('click', evento => { evento.preventDefault(); evento.stopPropagation(); fechada = relogio !== null; esconder() })
      aviso.append(fechar)
      ;(doc.body || doc.documentElement).append(aviso)
    }
    doc.addEventListener('dragover', evento => {
      if (!temArquivos(evento) || !podeSoltar()) return
      evento.preventDefault()
      evento.dataTransfer.dropEffect = 'copy'
      mostrar()
      clearTimeout(relogio)
      relogio = setTimeout(saiu, SEM_ARQUIVO_MS)
    })
    doc.addEventListener('dragleave', evento => { if (!evento.relatedTarget) saiu() })
    doc.addEventListener('drop', evento => {
      saiu()
      if (!temArquivos(evento) || !podeSoltar()) return
      evento.preventDefault()
      const arquivos = [...evento.dataTransfer.files]
      if (arquivos.length) aoSoltar(arquivos)
    })
  }

  // ---------- v0.32.0: arquivo solto na página de um documento externo em branco ----------
  // O documento aberto à direita (quadro ifrConteudoVisualizacao e os quadros dentro dele, que o SEI troca a
  // cada clique) aceita o arquivo só se estiver em branco. O arquivo é só anexado ("Alterar Documento
  // Externo"): tipo, data, nível de acesso e nome na árvore ficam como estão. Antes, a pessoa confirma.
  const quadroDocumento = document.getElementById('ifrConteudoVisualizacao')
  if (quadroDocumento) {
    quadroDocumento.addEventListener('load', () => { alvoGuardado = undefined; ligarQuadro(quadroDocumento) })
    ligarQuadro(quadroDocumento)
  }
  // Documento em branco aberto agora (lido da árvore uma vez por documento aberto), ou null.
  function documentoEmBranco () {
    if (alvoGuardado !== undefined) return alvoGuardado
    let endereco = ''
    try { endereco = quadroDocumento.contentWindow.location.href } catch (erro) { return null }
    const lida = seiPedidos.arvoreAberta()
    alvoGuardado = lida ? regras.externoEmBranco(lida.documentos, endereco) : null
    return alvoGuardado
  }
  // v0.36.1: formulário do SEI aberto à direita (Incluir ou Alterar documento externo): o arquivo é do campo
  // "Anexar Arquivo..." do próprio SEI, mesmo que o documento escolhido na árvore esteja em branco.
  function formularioAberto (quadro) {
    let doc
    try { doc = quadro.contentDocument } catch (erro) { return false }
    if (!doc) return false
    return !!doc.getElementById('frmDocumentoCadastro') || [...doc.querySelectorAll('iframe')].some(formularioAberto)
  }
  function ligarQuadro (quadro) {
    let doc
    try { doc = quadro.contentDocument } catch (erro) { return }
    if (!doc || !doc.documentElement) return
    if (!doc.documentElement.dataset.extensaoIftoAnexar) {
      doc.documentElement.dataset.extensaoIftoAnexar = 'sim'
      ligarSoltura(doc, 'Solte aqui para anexar o arquivo a este documento em branco (você confere antes)', () => !formularioAberto(quadroDocumento) && !!documentoEmBranco(), confirmarAnexo)
    }
    for (const filho of doc.querySelectorAll('iframe')) {
      if (!filho.dataset.extensaoIftoAnexar) {
        filho.dataset.extensaoIftoAnexar = 'sim'
        filho.addEventListener('load', () => ligarQuadro(filho))
      }
      ligarQuadro(filho)
    }
  }

  async function confirmarAnexo (arquivos) {
    const alvo = documentoEmBranco()
    if (!alvo) return
    if (aberta) aberta.fechar()
    opcoes = await configuracoes.lerConfiguracoes()
    const titulo = 'Anexar arquivo ao documento'
    const fechar = { texto: 'Fechar', aoClicar: j => j.fechar() }
    if (arquivos.length > 1) {
      aberta = janela.abrir({ titulo, conteudo: [criar('p', { className: 'aviso amarelo', textContent: 'Arraste um arquivo só: o documento em branco recebe um arquivo. Para criar vários documentos de uma vez, arraste os arquivos para a árvore do processo, à esquerda.' })], botoes: [fechar], aoFechar: () => { aberta = null } })
      return
    }
    const arquivo = arquivos[0]
    const pronto = regras.prepararArquivo({ nome: arquivo.name, tamanho: arquivo.size }, [], opcoes)
    const avisos = pronto.avisos.map(aviso => {
      const p = criar('p', { className: 'aviso ' + (aviso.nivel === 'erro' ? 'vermelho' : 'amarelo') })
      p.append(regras.montarPartes(aviso.partes, document))
      return p
    })
    const conteudo = [
      criar('div', { className: 'cartao compacto' }, [
        criar('div', { className: 'linha' }, [criar('h2', { textContent: pronto.nome }), criar('span', { className: 'apoio', textContent: regras.tamanhoEmTexto(arquivo.size) })]),
        criar('p', { textContent: 'Vai para: ' + alvo.rotulo })
      ]),
      criar('p', { className: 'apoio', textContent: pronto.bloqueado ? 'Este arquivo não será anexado.' : 'Só o arquivo é anexado: o tipo, a data, o nível de acesso e o Nome na Árvore do documento ficam como estão. Nada vai para o SEI antes de você clicar em "Anexar".' }),
      ...avisos
    ]
    const botoes = pronto.bloqueado ? [fechar] : [{ texto: 'Anexar', tipo: 'principal', aoClicar: j => anexar(j) }, { texto: 'Cancelar', aoClicar: j => j.fechar() }]
    aberta = janela.abrir({ titulo, conteudo, botoes, aoFechar: () => { aberta = null } })

    // O clique em "Anexar" é a confirmação; o arquivo é lido só agora.
    async function anexar (j) {
      for (const botao of j.botoes) botao.disabled = true
      j.trocarConteudo([criar('p', { textContent: `Anexando "${pronto.nome}"…` })])
      let erro = null
      try {
        let bytes
        try { bytes = await arquivo.arrayBuffer() } catch (falha) { throw new Error('Não consegui ler o arquivo do computador. Arraste de novo.') }
        await seiPedidos.anexarAoExterno(alvo, { bytes, nome: pronto.nome, tipo: arquivo.type || 'application/octet-stream' })
      } catch (falha) {
        erro = falha
      }
      if (erro) {
        j.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: erro.message })])
        j.trocarBotoes([{ texto: 'Tentar de novo', tipo: 'principal', aoClicar: () => confirmarAnexo([arquivo]) }, fechar])
        return
      }
      alvoGuardado = undefined
      seiPedidos.recarregarArvore()
      try { quadroDocumento.contentWindow.location.reload() } catch (falha) { /* a árvore recarregada já mostra */ }
      j.fechar()
      janela.mensagemRapida(`Pronto: "${pronto.nome}" foi anexado ao documento ${alvo.sei || alvo.rotulo}.`)
    }
  }

  // ---------- Janela: ler os tipos do SEI e mostrar a lista ----------
  async function abrirLista (arquivos) {
    if (aberta) aberta.fechar()
    opcoes = await configuracoes.lerConfiguracoes()
    const lida = seiPedidos.arvoreAberta()
    const titulo = arquivos.length === 1 ? 'Incluir 1 arquivo no processo' : `Incluir ${arquivos.length} arquivos no processo`
    const fechar = { texto: 'Fechar', aoClicar: j => j.fechar() }
    if (!lida || !lida.linkIncluir) {
      aberta = janela.abrir({ titulo, conteudo: [criar('p', { className: 'aviso vermelho', textContent: 'Não consegui ler a árvore deste processo, ou você não pode incluir documentos nele. Espere o processo abrir e arraste de novo.' })], botoes: [fechar] })
      return
    }
    let cancelado = false
    aberta = janela.abrir({
      titulo,
      conteudo: [criar('p', { textContent: 'Lendo os tipos de documento no SEI…' })],
      botoes: [{ texto: 'Cancelar', aoClicar: j => { cancelado = true; j.fechar() } }],
      aoFechar: () => { cancelado = true; aberta = null }
    })
    const esta = aberta
    let tipos
    try {
      tipos = await seiPedidos.tiposDoExterno(lida)
      if (!tipos.length) throw new Error('O SEI não mostrou a lista de tipos de documento.')
    } catch (erro) {
      if (cancelado) return
      esta.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: erro.message })])
      esta.trocarBotoes([{ texto: 'Tentar de novo', tipo: 'principal', aoClicar: () => abrirLista(arquivos) }, fechar])
      return
    }
    if (cancelado) return
    mostrarLista(esta, arquivos, tipos)
  }

  function mostrarLista (esta, arquivos, tipos) {
    const linhas = arquivos.map(arquivo => ({
      arquivo,
      ...regras.prepararArquivo({ nome: arquivo.name, tamanho: arquivo.size, modificado: arquivo.lastModified }, tipos, opcoes)
    }))
    const resumo = criar('p', { className: 'aviso amarelo' })
    const incluir = { texto: 'Incluir no processo', tipo: 'principal', aoClicar: j => confirmar(j) }

    const cartoes = linhas.map(linha => {
      const cartao = criar('div', { className: 'cartao compacto' })
      const titulo = criar('div', { className: 'linha' }, [
        criar('h2', { textContent: linha.nome }),
        criar('span', { className: 'apoio', textContent: regras.tamanhoEmTexto(linha.arquivo.size) })
      ])
      const avisos = linha.avisos.map(aviso => {
        const p = criar('p', { className: 'aviso ' + (aviso.nivel === 'erro' ? 'vermelho' : 'amarelo') })
        p.append(regras.montarPartes(aviso.partes, document))
        return p
      })
      if (linha.bloqueado) {
        cartao.append(titulo, ...avisos, criar('p', { className: 'apoio', textContent: 'Este arquivo não será incluído.' }))
        return cartao
      }
      // Tipo: lista do SEI; sem tipo reconhecido, fica "Escolha o tipo" (a extensão pergunta).
      // v0.36.1: nome que serve a mais de um tipo ("portaria_"): os que combinam vêm primeiro.
      const opcao = tipo => criar('option', { value: tipo, textContent: tipo })
      const combinam = linha.sugestoes
      const lista = criar('select', {}, [
        criar('option', { value: '', textContent: 'Escolha o tipo…' }),
        ...(combinam.length ? [criar('optgroup', { label: 'Combinam com o nome' }, combinam.map(opcao)), criar('optgroup', { label: 'Todos os tipos' }, tipos.filter(tipo => !combinam.includes(tipo)).map(opcao))] : tipos.map(opcao))
      ])
      lista.value = linha.tipo || ''
      lista.addEventListener('change', () => { linha.tipo = lista.value || null; atualizar() })
      const nome = criar('input', { type: 'text', value: linha.nomeArvore, maxLength: 50, placeholder: 'Nome na Árvore (opcional)' })
      nome.addEventListener('input', () => { linha.nomeArvore = nome.value })
      // v0.36.5: Enter no Nome na Árvore = clicar em "Incluir no processo" (nada acontece se o botão está apagado).
      nome.addEventListener('keydown', evento => {
        if (evento.key !== 'Enter' || evento.isComposing) return
        evento.preventDefault()
        const botao = esta.botoes[0]
        if (!botao.disabled) botao.click()
      })
      const remover = criar('button', { className: 'pequeno', type: 'button', textContent: 'Tirar da lista' })
      remover.addEventListener('click', () => { linha.removido = true; cartao.remove(); atualizar() })
      const origem = { nome: 'pelo nome do arquivo', regra: 'por uma regra sua', padrao: 'tipo padrão' }[linha.origem]
      cartao.append(
        titulo,
        criar('label', {}, ['Tipo do documento' + (origem ? ` (${origem})` : ''), lista]),
        criar('label', {}, ['Nome na Árvore', nome]),
        criar('p', { className: 'detalhe', textContent: `Data: ${linha.data} · Nato-digital · Público` }),
        ...avisos,
        criar('div', { className: 'linha' }, [remover])
      )
      return cartao
    })

    const avisoNivel = opcoes.externoNivel === 'restrito' || opcoes.externoFormato === 'digitalizado'
      ? criar('p', { className: 'aviso amarelo', textContent: 'Arrastando, os documentos entram como Público e Nato-digital. Para Restrito ou Digitalizado, use "Incluir Documento › Externo".' })
      : null
    esta.trocarConteudo([
      criar('p', { className: 'apoio', textContent: 'Confira o tipo e o Nome na Árvore de cada arquivo. Nada vai para o SEI antes de você clicar em "Incluir no processo".' }),
      avisoNivel, ...cartoes, resumo
    ].filter(Boolean))
    esta.trocarBotoes([incluir, { texto: 'Cancelar', aoClicar: j => j.fechar() }])
    atualizar()

    function prontos () { return linhas.filter(linha => !linha.bloqueado && !linha.removido) }
    function atualizar () {
      const vao = prontos()
      const semTipo = vao.filter(linha => !linha.tipo).length
      const botao = esta.botoes[0]
      botao.disabled = !vao.length || semTipo > 0
      if (!vao.length) resumo.textContent = 'Nenhum arquivo para incluir.'
      else if (semTipo) resumo.textContent = semTipo === 1 ? 'Escolha o tipo do arquivo que está sem tipo.' : `Escolha o tipo dos ${semTipo} arquivos que estão sem tipo.`
      else resumo.textContent = vao.length === 1 ? 'Pronto para incluir 1 documento.' : `Pronto para incluir ${vao.length} documentos.`
      resumo.className = 'aviso ' + (botao.disabled ? 'amarelo' : 'verde')
      botao.textContent = vao.length > 1 ? `Incluir ${vao.length} no processo` : 'Incluir no processo'
    }

    // O clique é a confirmação; os arquivos são lidos só agora.
    async function confirmar (j) {
      const vao = prontos()
      if (!vao.length || vao.some(linha => !linha.tipo)) return
      for (const botao of j.botoes) botao.disabled = true
      let itens
      try {
        itens = await Promise.all(vao.map(async linha => ({
          tipo: linha.tipo,
          nomeArvore: ExtensaoIFTO.sei.nomeNaArvore(linha.nomeArvore),
          data: linha.data,
          arquivo: { bytes: await linha.arquivo.arrayBuffer(), nome: linha.nome, tipo: linha.arquivo.type || 'application/octet-stream' }
        })))
      } catch (erro) {
        j.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: 'Não consegui ler os arquivos do computador. Arraste de novo.' })])
        j.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: k => k.fechar() }])
        return
      }
      seiPedidos.incluirNaJanela(itens, j, item => item.tipo + (item.nomeArvore ? ' ' + item.nomeArvore : ''))
    }
  }
})()
