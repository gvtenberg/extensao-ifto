// v0.27.1 (spec base-e-sei, etapa 3): arrastar arquivos do computador para a árvore do processo. Cada arquivo
// vira um documento externo; antes, a lista para conferir o tipo, o Nome na Árvore e o tamanho de cada um.
// Nada vai para o SEI antes do clique em "Incluir" (a gravação usa o mesmo caminho do SICAF:
// seiPedidos.incluirNaJanela). Tipo: pelo nome do arquivo, regras da pessoa e tipo padrão (D14); sem
// nenhum, a pessoa escolhe na lista.
(async function () {
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { configuracoes, seiPedidos, janela, documentoExterno: regras } = ExtensaoIFTO
  const quadroArvore = document.getElementById('ifrArvore')
  if (!quadroArvore || !janela || !seiPedidos) return
  const { criar } = janela
  let opcoes = await configuracoes.lerConfiguracoes()
  if (!opcoes.arrastarArquivos) return
  let aberta = null

  // A árvore é um quadro que o SEI recarrega: liga de novo a cada carga.
  quadroArvore.addEventListener('load', ligar)
  ligar()

  function ligar () {
    let doc
    try { doc = quadroArvore.contentDocument } catch (erro) { return }
    if (!doc || !doc.body || doc.body.dataset.extensaoIftoArrastar) return
    doc.body.dataset.extensaoIftoArrastar = 'sim'
    let aviso = null
    const temArquivos = evento => evento.dataTransfer && [...evento.dataTransfer.types].includes('Files')
    const mostrar = sim => {
      if (sim && !aviso) {
        aviso = doc.createElement('div')
        aviso.textContent = 'Solte aqui para incluir os arquivos neste processo (você confere antes)'
        Object.assign(aviso.style, {
          position: 'fixed', inset: '4px', zIndex: '2147483000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '12px', border: '3px dashed #1E5E33', borderRadius: '10px', background: 'rgba(231,242,234,.92)',
          color: '#1E5E33', font: '600 14px/1.4 system-ui, sans-serif', pointerEvents: 'none'
        })
        doc.body.append(aviso)
      } else if (!sim && aviso) {
        aviso.remove()
        aviso = null
      }
    }
    doc.addEventListener('dragover', evento => {
      if (!temArquivos(evento)) return
      evento.preventDefault()
      evento.dataTransfer.dropEffect = 'copy'
      mostrar(true)
    })
    doc.addEventListener('dragleave', evento => { if (!evento.relatedTarget) mostrar(false) })
    doc.addEventListener('drop', evento => {
      if (!temArquivos(evento)) return
      evento.preventDefault()
      mostrar(false)
      const arquivos = [...evento.dataTransfer.files]
      if (arquivos.length) abrirLista(arquivos)
    })
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
      const lista = criar('select', {}, [criar('option', { value: '', textContent: 'Escolha o tipo…' }), ...tipos.map(tipo => criar('option', { value: tipo, textContent: tipo }))])
      lista.value = linha.tipo || ''
      lista.addEventListener('change', () => { linha.tipo = lista.value || null; atualizar() })
      const nome = criar('input', { type: 'text', value: linha.nomeArvore, maxLength: 50, placeholder: 'Nome na Árvore (opcional)' })
      nome.addEventListener('input', () => { linha.nomeArvore = nome.value })
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
