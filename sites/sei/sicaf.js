// v0.10.0: SICAF automático (spec sicaf-automatico). Na CGOC, com um processo aberto, lê a árvore (notas
// fiscais, atestes, Folha de Encaminhamento e Sicafs já incluídos) e avisa na barra da extensão
// "N notas sem SICAF – Buscar". Nada abre antes do clique (decisão D2).
// v0.11.0: CNPJ selecionado (botão ao lado da seleção ou menu do botão direito) abre a janela do SICAF com
// o CNPJ, em qualquer página principal do SEI; na janela também dá para colar ou digitar o CNPJ.
(async function () {
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { sicaf: regras, configuracoes, barra, seiPedidos, pdfTexto, janela } = ExtensaoIFTO
  const campoUnidade = document.getElementById('lnkInfraUnidade')
  const quadroArvore = document.getElementById('ifrArvore')
  if (!barra || !campoUnidade) return
  const unidade = campoUnidade.textContent.trim()
  const navegador = globalThis.browser || globalThis.chrome
  const { criar } = janela

  let opcoes = await configuracoes.lerConfiguracoes()
  // v0.13.0: busca em andamento (fornecedores pedidos e situação do processo) e a janela que espera o SICAF.
  let pedidoAtual = null
  let janelaDaBusca = null

  // ---------- CNPJ escolhido (seleção, menu do botão direito ou campo da janela) ----------
  navegador.runtime.onMessage.addListener((recado, remetente, responder) => {
    if (!recado) return
    if (recado.tipo === 'sicafPronto') {
      responder({ recebido: true })
      aoChegarDoSicaf(recado.resultados || [])
      return
    }
    if (recado.tipo !== 'sicafCnpj') return
    if (opcoes.incluirSicaf === 'desligada') { responder({ recebido: false }); return }
    responder({ recebido: true })
    janelaDoCnpj(recado.cnpj ? regras.formatarCnpj(recado.cnpj) : recado.texto || '')
  })

  // Janela com o campo do CNPJ (já preenchido quando veio da seleção); confere os dígitos.
  function janelaDoCnpj (textoInicial) {
    const campo = criar('input', { type: 'text', value: textoInicial || '', placeholder: '00.000.000/0000-00' })
    const aviso = criar('p', { className: 'aviso', hidden: true })
    const conferirCampo = () => {
      const achado = regras.cnpjDaSelecao(campo.value)
      aviso.hidden = !campo.value.trim()
      if (!achado) { aviso.className = 'aviso vermelho'; aviso.textContent = 'Isso não é um CNPJ (14 números, com ou sem pontos).'; return null }
      if (!achado.valido) { aviso.className = 'aviso vermelho'; aviso.textContent = 'CNPJ com número errado: confira os dois últimos dígitos.'; return null }
      aviso.className = 'aviso verde'
      aviso.textContent = 'CNPJ ' + regras.formatarCnpj(achado.cnpj) + ' conferido.'
      return achado.cnpj
    }
    campo.addEventListener('input', conferirCampo)
    const aberta = janela.abrir({
      titulo: 'Buscar SICAF',
      conteudo: [criar('label', {}, ['CNPJ do fornecedor (digite ou cole)', campo]), aviso],
      botoes: [
        { texto: 'Cancelar', aoClicar: j => j.fechar() },
        { texto: 'Buscar no SICAF', tipo: 'principal', aoClicar: j => { const cnpj = conferirCampo(); if (cnpj) buscarCnpj(cnpj, j) } }
      ]
    })
    campo.addEventListener('keydown', evento => { if (evento.key === 'Enter') aberta.botoes[1].click() })
    conferirCampo()
    campo.focus()
    return aberta
  }

  // v0.13.0: CNPJ escolhido vai direto para o SICAF.
  function buscarCnpj (cnpj, aberta) {
    buscarNoSicaf([{ cnpj, nome: '', notas: [] }], null, aberta)
  }

  // ---------- Busca no SICAF (v0.13.0) ----------
  // Pede ao fundo da extensão: abre a aba do SICAF, pesquisa cada CNPJ e devolve os PDFs (sicafPronto).
  async function buscarNoSicaf (grupos, resultado, aberta) {
    const permissao = await navegador.runtime.sendMessage({ tipo: 'sicafPermissao' })
    if (!permissao || !permissao.permitido) {
      aberta.trocarConteudo([
        criar('p', { textContent: 'Para buscar no SICAF, a extensão precisa de permissão para abrir o Compras.gov.br e salvar o PDF na pasta Downloads. O navegador pede uma vez só.' }),
        criar('p', { className: 'apoio', textContent: 'Clique em "Abrir configurações" e depois em "Permitir acesso ao Compras.gov.br". Volte a esta aba e clique em "Buscar no SICAF".' })
      ])
      aberta.trocarBotoes([
        { texto: 'Cancelar', aoClicar: j => j.fechar() },
        { texto: 'Abrir configurações', aoClicar: () => navegador.runtime.sendMessage({ tipo: 'abrirConfiguracoes' }) },
        { texto: 'Buscar no SICAF', tipo: 'principal', aoClicar: j => buscarNoSicaf(grupos, resultado, j) }
      ])
      return
    }
    pedidoAtual = { grupos, resultado }
    janelaDaBusca = aberta
    aberta.trocarConteudo([
      criar('p', { textContent: 'Buscando no SICAF:' }),
      criar('ul', {}, grupos.map(grupo => criar('li', { textContent: regras.formatarCnpj(grupo.cnpj) + (grupo.nome ? ' – ' + grupo.nome : '') }))),
      criar('p', { className: 'apoio', textContent: 'Uma aba do Compras.gov.br foi aberta. Se ele pedir, entre com Gov.br (perfil Governo): a extensão continua sozinha e volta para esta aba com o PDF.' })
    ])
    aberta.trocarBotoes([{ texto: 'Parar a busca', aoClicar: j => { navegador.runtime.sendMessage({ tipo: 'sicafCancelar' }); pedidoAtual = null; j.fechar() } }])
    const resposta = await navegador.runtime.sendMessage({ tipo: 'sicafBuscar', cnpjs: grupos.map(grupo => grupo.cnpj) })
    if (resposta && resposta.erro) {
      aberta.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: 'Não consegui abrir o SICAF: ' + resposta.erro })])
      aberta.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }])
    }
  }

  // PDFs que voltaram do SICAF: confere o CNPJ dentro do PDF e mostra cada fornecedor.
  async function aoChegarDoSicaf (resultados) {
    const pedido = pedidoAtual
    pedidoAtual = null
    if (janelaDaBusca) janelaDaBusca.fechar()
    janelaDaBusca = null
    const fornecedores = []
    for (const item of resultados) {
      const grupo = (pedido && pedido.grupos.find(outro => outro.cnpj === item.cnpj)) || { cnpj: item.cnpj, nome: '', notas: [] }
      const fornecedor = { ...grupo, nomeNoSicaf: item.nome || '', erro: item.erro || null, bytes: null, nomeDoArquivo: item.nomeDoArquivo, avisos: [] }
      if (item.arquivo) {
        fornecedor.bytes = regras.deBase64(item.arquivo)
        try {
          const lido = regras.lerPdfDoSicaf(await pdfTexto.textoDoPdf(fornecedor.bytes))
          if (lido.cnpj && lido.cnpj !== item.cnpj) fornecedor.avisos.push({ nivel: 'vermelho', texto: `O PDF do SICAF é de outro CNPJ (${regras.formatarCnpj(lido.cnpj)}).` })
          if (!fornecedor.nomeNoSicaf) fornecedor.nomeNoSicaf = lido.razaoSocial
        } catch (erro) {
          fornecedor.avisos.push({ nivel: 'amarelo', texto: 'Não consegui ler o PDF do SICAF para conferir o CNPJ.' })
        }
      }
      fornecedores.push(fornecedor)
    }
    mostrarResultadoDoSicaf(fornecedores, pedido)
  }

  function linkDoPdf (fornecedor) {
    const link = criar('a', { textContent: 'Ver o PDF', target: '_blank', rel: 'noopener' })
    link.href = URL.createObjectURL(new Blob([fornecedor.bytes], { type: 'application/pdf' }))
    return link
  }

  // ---------- Confirmação e inclusão no SEI (v0.14.0) ----------
  // Na CGOC: por fornecedor Sicaf (com o PDF) e Consulta, por nota um Anexo; nas outras unidades, só o
  // Sicaf (etapa 6). Nada é escrito no SEI antes do clique em "Incluir no processo".
  async function mostrarResultadoDoSicaf (fornecedores, pedido) {
    const cgoc = regras.ehCgoc(unidade)
    const lida = quadroArvore ? seiPedidos.arvoreAberta() : null
    // CNPJ escolhido na CGOC: as notas pendentes desse fornecedor ganham o Anexo.
    if (cgoc && lida && !(pedido && pedido.resultado)) {
      try {
        const analise = await analisar()
        for (const fornecedor of fornecedores) {
          if (!fornecedor.notas.length && analise) fornecedor.notas = analise.situacao.notas.filter(nota => nota.cnpj === fornecedor.cnpj && !nota.anexoFeito)
        }
      } catch (erro) {}
    }
    for (const fornecedor of fornecedores) fornecedor.temPdf = Boolean(fornecedor.bytes)
    const itens = regras.documentosParaIncluir(fornecedores, { soSicaf: !cgoc })
    for (const item of itens) {
      if (item.tipo !== 'Sicaf') continue
      const fornecedor = fornecedores.find(outro => outro.cnpj === item.cnpj)
      item.arquivo = { bytes: fornecedor.bytes, nome: fornecedor.nomeDoArquivo || regras.nomeDoArquivo(fornecedor.cnpj) }
    }
    const nomeDoItem = item => item.tipo + (item.nomeArvore ? ' ' + item.nomeArvore : '')
    const cartoes = fornecedores.map(fornecedor => {
      const doFornecedor = itens.filter(item => item.cnpj === fornecedor.cnpj)
      return criar('div', { className: 'cartao' }, [
        criar('h2', { textContent: regras.formatarCnpj(fornecedor.cnpj) + (fornecedor.nomeNoSicaf ? ' – ' + fornecedor.nomeNoSicaf : '') }),
        fornecedor.erro ? criar('p', { className: 'aviso vermelho', textContent: fornecedor.erro }) : criar('p', {}, ['PDF do SICAF obtido (também na pasta Downloads). ', linkDoPdf(fornecedor)]),
        ...fornecedor.avisos.map(aviso => criar('p', { className: 'aviso ' + aviso.nivel, textContent: aviso.texto })),
        doFornecedor.length ? criar('p', { className: 'apoio', textContent: 'Será incluído:' }) : null,
        doFornecedor.length ? criar('ul', {}, doFornecedor.map(item => criar('li', { textContent: nomeDoItem(item) + (item.arquivo ? ' (com o PDF)' : '') }))) : null
      ])
    })
    const botoesDeFechar = [{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }]
    if (!lida) {
      janela.abrir({ titulo: 'SICAF', conteudo: [...cartoes, criar('p', { className: 'apoio', textContent: 'Para incluir no SEI, abra o processo e busque de novo (o PDF de hoje já está guardado).' })], botoes: botoesDeFechar })
      return
    }
    if (!itens.length) {
      janela.abrir({ titulo: 'SICAF', conteudo: cartoes, botoes: botoesDeFechar })
      return
    }
    const temVermelho = fornecedores.some(fornecedor => fornecedor.temPdf && fornecedor.avisos.some(aviso => aviso.nivel === 'vermelho'))
    const alerta = criar('p', { className: 'aviso vermelho', hidden: true, textContent: 'Há avisos em vermelho. Confira antes de incluir.' })
    let confirmouVermelho = false
    janela.abrir({
      titulo: 'Incluir no processo ' + (lida.numero || ''),
      conteudo: [...cartoes, alerta],
      botoes: [
        { texto: 'Cancelar', aoClicar: j => j.fechar() },
        {
          texto: `Incluir no processo (${itens.length})`,
          tipo: 'principal',
          aoClicar: j => {
            if (temVermelho && !confirmouVermelho) {
              confirmouVermelho = true
              alerta.hidden = false
              j.botoes[1].textContent = 'Incluir mesmo assim'
              j.botoes[1].className = 'acao perigo'
              return
            }
            incluirNoProcesso(itens, j, nomeDoItem)
          }
        }
      ]
    })
  }

  async function incluirNoProcesso (itens, aberta, nomeDoItem) {
    const lida = seiPedidos.arvoreAberta()
    if (!lida) { aberta.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: 'Não consegui ler a árvore do processo. Espere o processo abrir e tente de novo.' })]); return }
    const andamento = { parar: false }
    const incluidos = []
    const progresso = criar('p', { textContent: 'Incluindo…' })
    aberta.trocarConteudo([progresso])
    aberta.trocarBotoes([{ texto: 'Parar', aoClicar: () => { andamento.parar = true } }])
    let erro = null
    try {
      await seiPedidos.incluirExternos(lida, itens, {
        incluidos,
        deveParar: () => andamento.parar,
        aoAvancar: posicao => { progresso.textContent = `Incluindo ${nomeDoItem(itens[posicao])} (${posicao + 1} de ${itens.length})…` }
      })
    } catch (falha) {
      erro = falha
    }
    if (incluidos.length) seiPedidos.recarregarArvore()
    const feitos = incluidos.length ? 'Incluídos: ' + ExtensaoIFTO.documentosPagamento.listaEmTexto(itens.slice(0, incluidos.length).map(nomeDoItem)) + '.' : 'Nenhum documento foi incluído.'
    aberta.trocarConteudo([
      erro || andamento.parar ? criar('p', { className: 'aviso vermelho', textContent: erro ? erro.message : 'Inclusão parada.' }) : criar('p', { className: 'aviso verde', textContent: 'Pronto.' }),
      criar('p', { textContent: feitos })
    ])
    aberta.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }])
  }

  if (!quadroArvore) return
  const ID = 'sicaf'
  const botao = barra.botao(ID, { texto: 'Notas sem SICAF', titulo: '', ordem: 15, aoClicar: () => clicou() })
  const escreverNoBotao = texto => { botao.lastChild.textContent = ' ' + texto }
  const avisoLigado = () => regras.ehCgoc(unidade) && regras.funcaoLigada(opcoes.incluirSicaf, unidade)

  // ---------- Leitura do processo ----------
  // O que já foi lido não é lido de novo (o documento não muda depois de assinado ou incluído).
  const atestesLidos = new Map()
  const sicafsLidos = new Map()
  async function lerAteste (doc) {
    if (!atestesLidos.has(doc.id)) {
      atestesLidos.set(doc.id, seiPedidos.pedir(doc.link).then(pagina => regras.lerAteste(regras.textoDoHtml(pagina.html))).catch(() => []))
    }
    return atestesLidos.get(doc.id)
  }
  async function cnpjsDoSicaf (doc) {
    if (!sicafsLidos.has(doc.id)) {
      sicafsLidos.set(doc.id, seiPedidos.baixar(doc.link).then(bytes => pdfTexto.textoDoPdf(bytes)).then(regras.acharCnpjs).catch(() => []))
    }
    return sicafsLidos.get(doc.id)
  }

  // Situação do processo aberto: notas pendentes e o que já existe depois da última Folha.
  async function analisar () {
    const lida = seiPedidos.arvoreAberta()
    if (!lida) return null
    const inicial = regras.situacaoDoProcesso(lida.documentos)
    if (!inicial.notas.length) return { lida, situacao: inicial }
    const atestes = {}
    for (const doc of inicial.atestes) atestes[doc.id] = await lerAteste(doc)
    const cnpjsDosSicafs = {}
    for (const doc of inicial.sicafs) cnpjsDosSicafs[doc.id] = await cnpjsDoSicaf(doc)
    const cnpjsComSicaf = new Set(Object.values(cnpjsDosSicafs).flat())
    return { lida, situacao: regras.situacaoDoProcesso(lida.documentos, { atestes, cnpjsDosSicafs }), cnpjsComSicaf }
  }

  // ---------- Aviso na barra ----------
  let atual = null
  let vez = 0
  async function atualizar () {
    if (!avisoLigado()) { barra.mostrar(ID, false); return }
    const minhaVez = ++vez
    let resultado = null
    try { resultado = await analisar() } catch (erro) { resultado = null }
    if (minhaVez !== vez) return
    atual = resultado
    const pendentes = resultado ? resultado.situacao.pendentes : []
    if (!pendentes.length) { barra.mostrar(ID, false); return }
    escreverNoBotao(regras.textoDoAviso(pendentes.length) + ' – Buscar')
    botao.title = 'Notas fiscais depois da última Folha de Encaminhamento sem SICAF:\n' +
      pendentes.map(nota => `Nota ${nota.numero || '?'} – ${nota.fornecedor || 'fornecedor não identificado'}`).join('\n')
    barra.mostrar(ID, true)
  }

  // A árvore recarrega sozinha (documento incluído, processo trocado): lê de novo.
  let espera = null
  const atualizarDepois = () => { clearTimeout(espera); espera = setTimeout(atualizar, 400) }
  quadroArvore.addEventListener('load', atualizarDepois)

  // ---------- Clique: ler as notas e conferir com o ateste (v0.12.0, decisões D8 e D9) ----------
  let ocupado = false
  async function clicou () {
    if (ocupado) return
    ocupado = true
    try {
      const resultado = await analisar()
      const pendentes = resultado ? resultado.situacao.pendentes : []
      if (!pendentes.length) { window.alert('Este processo não tem notas sem SICAF depois da última Folha de Encaminhamento.'); return }
      const conferidas = []
      for (let posicao = 0; posicao < pendentes.length; posicao++) {
        escreverNoBotao(`Lendo notas (${posicao + 1}/${pendentes.length})…`)
        conferidas.push(await conferir(pendentes[posicao]))
      }
      janelaDasNotas(conferidas, resultado)
    } catch (erro) {
      window.alert('Não consegui ler as notas do processo: ' + erro.message)
    } finally {
      ocupado = false
      atualizarDepois()
    }
  }

  // Texto do PDF da nota (vazio se for imagem ou não abrir) conferido com o ateste.
  async function conferir (nota) {
    let texto = ''
    try { texto = await pdfTexto.textoDoPdf(await seiPedidos.baixar(nota.link)) } catch (erro) { texto = '' }
    const resultado = regras.conferirNota(texto, nota.ateste)
    return { ...nota, ...resultado, cnpjEscolhido: resultado.cnpj }
  }

  // Janela com cada nota: CNPJ (ou escolha), avisos vermelhos e amarelos. Vermelho pede um segundo clique.
  function janelaDasNotas (notas, resultado) {
    const cartoes = notas.map(nota => cartaoDaNota(nota, resultado.cnpjsComSicaf))
    const alerta = criar('p', { className: 'aviso vermelho', hidden: true, textContent: 'Há diferenças em vermelho. Confira a nota e o ateste antes de continuar.' })
    const temVermelho = notas.some(nota => nota.avisos.some(aviso => aviso.nivel === 'vermelho'))
    let confirmouVermelho = false
    janela.abrir({
      titulo: regras.textoDoAviso(notas.length),
      conteudo: [criar('p', { className: 'apoio', textContent: 'Notas depois da última Folha de Encaminhamento. A nota fiscal é a referência; o ateste é conferido com ela.' }), ...cartoes, alerta],
      botoes: [
        { texto: 'Cancelar', aoClicar: j => j.fechar() },
        {
          texto: 'Buscar no SICAF',
          tipo: 'principal',
          aoClicar: j => {
            const semCnpj = notas.filter(nota => !regras.cnpjValido(nota.cnpjEscolhido))
            if (semCnpj.length) {
              alerta.hidden = false
              alerta.textContent = 'Escolha ou digite o CNPJ do fornecedor da nota ' + semCnpj.map(nota => nota.numero || '?').join(', ') + '.'
              return
            }
            if (temVermelho && !confirmouVermelho) {
              confirmouVermelho = true
              alerta.hidden = false
              alerta.textContent = 'Há diferenças em vermelho. Confira a nota e o ateste antes de continuar.'
              j.botoes[1].textContent = 'Continuar mesmo assim'
              j.botoes[1].className = 'acao perigo'
              return
            }
            const grupos = regras.agruparPorFornecedor(notas.map(nota => ({ ...nota, cnpj: nota.cnpjEscolhido })))
            buscarFornecedores(grupos, resultado, j)
          }
        }
      ]
    })
  }

  function cartaoDaNota (nota, cnpjsComSicaf) {
    const titulo = `Nota ${nota.numero || '?'} – ${nota.fornecedor || 'fornecedor'}` + (nota.sei ? ` (SEI ${nota.sei})` : '')
    const partes = [criar('h2', { textContent: titulo })]
    if (nota.escolher) {
      const nome = 'cnpj-' + nota.id
      const outro = criar('input', { type: 'text', placeholder: 'Outro CNPJ' })
      const opcoes = nota.opcoes.map((cnpj, posicao) => {
        const marca = criar('input', { type: 'radio', name: nome, value: cnpj, checked: cnpj === nota.cnpjEscolhido })
        marca.addEventListener('change', () => { if (marca.checked) { nota.cnpjEscolhido = cnpj; outro.value = '' } })
        const origem = cnpj === (nota.ateste && nota.ateste.cnpj) && cnpj !== nota.cnpj ? 'do ateste' : 'da nota'
        return criar('label', { className: 'escolha' }, [marca, `${regras.formatarCnpj(cnpj)} (${origem})`])
      })
      outro.addEventListener('input', () => {
        const achado = regras.cnpjDaSelecao(outro.value)
        nota.cnpjEscolhido = achado && achado.valido ? achado.cnpj : null
        for (const marca of opcoes.map(rotulo => rotulo.firstChild)) marca.checked = false
      })
      partes.push(criar('p', { textContent: 'Escolha o CNPJ do fornecedor:' }), ...opcoes, criar('label', {}, ['Outro (digite ou cole):', outro]))
    } else {
      partes.push(criar('p', { textContent: 'CNPJ do fornecedor: ' + regras.formatarCnpj(nota.cnpj) }))
    }
    for (const aviso of nota.avisos) partes.push(criar('p', { className: 'aviso ' + aviso.nivel, textContent: aviso.texto }))
    if (nota.cnpj && cnpjsComSicaf.has(nota.cnpj)) partes.push(criar('p', { className: 'aviso verde', textContent: 'Este fornecedor já tem Sicaf neste trecho do processo.' }))
    return criar('div', { className: 'cartao' }, partes)
  }

  // v0.13.0: fornecedores conferidos vão para o SICAF (os que já têm Sicaf neste trecho ficam de fora).
  function buscarFornecedores (grupos, resultado, aberta) {
    const faltam = grupos.filter(grupo => !resultado.cnpjsComSicaf.has(grupo.cnpj))
    if (!faltam.length) {
      aberta.trocarConteudo([criar('p', { textContent: 'Todos esses fornecedores já têm Sicaf neste trecho do processo.' })])
      aberta.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }])
      return
    }
    buscarNoSicaf(faltam, resultado, aberta)
  }

  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local' || !mudancas.configuracoes) return
    opcoes = await configuracoes.lerConfiguracoes()
    atualizarDepois()
  })

  atualizarDepois()
})()
