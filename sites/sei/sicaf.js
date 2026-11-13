// v0.10.0: SICAF automático (spec sicaf-automatico). Na CGOC, com um processo aberto, lê a árvore (notas
// fiscais, atestes, Folha de Encaminhamento e Sicafs já incluídos) e avisa na barra da extensão
// "N notas sem SICAF – Buscar". Nada abre antes do clique (decisão D2).
// v0.11.0: CNPJ selecionado (botão ao lado da seleção ou menu do botão direito) abre a janela do SICAF com
// o CNPJ, em qualquer página principal do SEI; na janela também dá para colar ou digitar o CNPJ.
// v0.13.0 a v0.15.0: busca no SICAF, inclusão no SEI e botão "Incluir SICAF" (Sempre ligada).
// v0.18.0 (pedido de 13/11/2026): um botão só na CGOC ("Automática"): SICAF e Simples Nacional buscados
// juntos; Sicaf e Consulta com os PDFs e Anexo em branco. "Sempre ligada" (equipe de licitação): só o botão
// "Incluir SICAF", que inclui só o Sicaf. Pedido "quais": 'tudo' (CGOC), 'sicaf' ou 'simples'.
(async function () {
  if (window.top !== window) return
  const ExtensaoIFTO = globalThis.ExtensaoIFTO
  const { sicaf: regras, simplesNacional, configuracoes, barra, seiPedidos, pdfTexto, janela } = ExtensaoIFTO
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
    responder({ recebido: true })
    // v0.16.0 (decidido em 13/11/2026): "Automática" = só na CGOC; nas outras unidades, "Sempre ligada".
    if (!regras.funcaoLigada(opcoes.incluirSicaf, unidade)) {
      janela.abrir({
        titulo: 'Buscar SICAF',
        conteudo: [criar('p', { textContent: 'Nesta unidade a busca do SICAF está desligada. Para usar, abra as configurações da extensão e, em "SICAF da nota fiscal", escolha "Sempre ligada".' })],
        botoes: [{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }]
      })
      return
    }
    // Seleção: o botão escolhido; menu do botão direito: tudo na CGOC, só o SICAF nas outras unidades.
    const quais = ['tudo', 'sicaf', 'simples'].includes(recado.quais) ? recado.quais : (regras.ehCgoc(unidade) ? 'tudo' : 'sicaf')
    janelaDoCnpj(recado.cnpj ? regras.formatarCnpj(recado.cnpj) : recado.texto || '', quais)
  })

  // v0.18.0: textos de cada pedido.
  const TITULOS = { tudo: 'Incluir SICAF, Simples e Anexo', sicaf: 'Incluir SICAF', simples: 'Incluir Simples Nacional' }
  const BUSCAR = { tudo: 'Buscar SICAF e Simples', sicaf: 'Buscar no SICAF', simples: 'Buscar no Simples Nacional' }

  // Janela com o campo do CNPJ (já preenchido quando veio da seleção); confere os dígitos.
  function janelaDoCnpj (textoInicial, quais) {
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
      titulo: TITULOS[quais],
      conteudo: [criar('label', {}, ['CNPJ do fornecedor (digite ou cole)', campo]), aviso],
      botoes: [
        { texto: 'Cancelar', aoClicar: j => j.fechar() },
        { texto: BUSCAR[quais], tipo: 'principal', aoClicar: j => { const cnpj = conferirCampo(); if (cnpj) buscarCnpj(cnpj, j, quais) } }
      ]
    })
    campo.addEventListener('keydown', evento => { if (evento.key === 'Enter') aberta.botoes[1].click() })
    conferirCampo()
    campo.focus()
    return aberta
  }

  // v0.13.0: CNPJ escolhido vai direto para o SICAF.
  // v0.18.2: com um processo aberto, confere antes o que já está nele (Sicaf e Consulta deste CNPJ).
  async function buscarCnpj (cnpj, aberta, quais) {
    const grupo = { cnpj, nome: '', notas: [], precisaSicaf: quais !== 'simples', precisaSimples: quais !== 'sicaf' }
    const lida = quadroArvore ? seiPedidos.arvoreAberta() : null
    if (lida) {
      aberta.trocarConteudo([criar('p', { textContent: 'Conferindo o que já está no processo…' })])
      const existentes = await jaNoProcesso(lida)
      if (existentes.cnpjsComSicaf.has(cnpj)) grupo.precisaSicaf = false
      if (existentes.raizesComConsulta.has(regras.raizDoCnpj(cnpj))) grupo.precisaSimples = false
      if (!grupo.precisaSicaf && !grupo.precisaSimples && quais !== 'tudo') {
        aberta.trocarConteudo([criar('p', { className: 'aviso verde', textContent: (quais === 'sicaf' ? 'O Sicaf' : 'A Consulta do Simples Nacional') + ' deste CNPJ já está no processo, depois da última Folha de Encaminhamento. Nada a incluir.' })])
        aberta.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }])
        return
      }
      if (!grupo.precisaSicaf && !grupo.precisaSimples) {
        // Na CGOC ainda pode faltar o Anexo das notas: segue sem abrir os sites.
        mostrarResultadoDoSicaf([{ ...grupo, nomeNoSicaf: '', avisos: [], pediuSicaf: false, pediuSimples: false }], { grupos: [grupo], quais })
        aberta.fechar()
        return
      }
    }
    buscarNoSicaf([grupo], null, aberta, quais)
  }

  // ---------- Busca no SICAF (v0.13.0) ----------
  // Pede ao fundo da extensão: abre a aba do SICAF, pesquisa cada CNPJ e devolve os PDFs (sicafPronto).
  async function buscarNoSicaf (grupos, resultado, aberta, quais) {
    const permissao = await navegador.runtime.sendMessage({ tipo: 'sicafPermissao' })
    if (!permissao || !permissao.permitido) {
      aberta.trocarConteudo([
        criar('p', { textContent: 'Para buscar no SICAF e no Simples Nacional, a extensão precisa de permissão para abrir esses sites e salvar os PDFs na pasta Downloads. O navegador pede uma vez só.' }),
        criar('p', { className: 'apoio', textContent: `Clique em "Abrir configurações" e depois em "Permitir acesso ao Compras.gov.br e ao Simples Nacional". Volte a esta aba e clique em "${BUSCAR[quais]}".` })
      ])
      aberta.trocarBotoes([
        { texto: 'Cancelar', aoClicar: j => j.fechar() },
        { texto: 'Abrir configurações', aoClicar: () => navegador.runtime.sendMessage({ tipo: 'abrirConfiguracoes' }) },
        { texto: BUSCAR[quais], tipo: 'principal', aoClicar: j => buscarNoSicaf(grupos, resultado, j, quais) }
      ])
      return
    }
    pedidoAtual = { grupos, resultado, quais }
    janelaDaBusca = aberta
    const sites = quais === 'sicaf' ? 'O SICAF abre' : quais === 'simples' ? 'O Simples Nacional abre' : 'O SICAF e o Simples Nacional abrem'
    aberta.trocarConteudo([
      criar('p', { textContent: quais === 'simples' ? 'Consultando no Simples Nacional:' : quais === 'sicaf' ? 'Buscando no SICAF:' : 'Buscando no SICAF e no Simples Nacional:' }),
      criar('ul', {}, grupos.map(grupo => criar('li', { textContent: regras.formatarCnpj(grupo.cnpj) + (grupo.nome ? ' – ' + grupo.nome : '') }))),
      criar('p', { className: 'apoio', textContent: `${sites} numa nova aba. Se pedirem, entre com Gov.br ou resolva a verificação. O resto é automático e, no fim, você volta para cá.` })
    ])
    aberta.trocarBotoes([{ texto: 'Parar a busca', aoClicar: j => { navegador.runtime.sendMessage({ tipo: 'sicafCancelar' }); pedidoAtual = null; j.fechar() } }])
    const resposta = await navegador.runtime.sendMessage({
      tipo: 'sicafBuscar',
      cnpjs: grupos.filter(grupo => grupo.precisaSicaf).map(grupo => grupo.cnpj),
      cnpjsSimples: grupos.filter(grupo => grupo.precisaSimples).map(grupo => grupo.cnpj)
    })
    if (resposta && resposta.erro) {
      aberta.trocarConteudo([criar('p', { className: 'aviso vermelho', textContent: 'Não consegui abrir a busca: ' + resposta.erro })])
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
      const fornecedor = { ...grupo, nomeNoSicaf: item.nome || '', erro: item.erro || null, bytes: null, nomeDoArquivo: item.nomeDoArquivo, avisos: [], pediuSicaf: !item.semSicaf, pediuSimples: Boolean(item.simples), salvo: Boolean(item.salvo), simplesSalvo: Boolean(item.simples && item.simples.salvo) }
      // v0.18.0: consulta do Simples Nacional (PDF da extensão, com texto) vai para a Consulta.
      if (item.simples && item.simples.arquivo) {
        fornecedor.simplesBytes = regras.deBase64(item.simples.arquivo)
        fornecedor.simplesArquivo = item.simples.nomeDoArquivo
        fornecedor.nomeConsulta = simplesNacional.nomeDaConsulta(item.simples.nome || fornecedor.nomeNoSicaf || grupo.nome)
      } else if (item.simples) {
        fornecedor.simplesErro = item.simples.erro || 'A consulta do Simples Nacional não foi feita.'
      }
      if (item.arquivo) {
        fornecedor.bytes = regras.deBase64(item.arquivo)
        try {
          const lido = regras.lerPdfDoSicaf(await pdfTexto.textoDoPdf(fornecedor.bytes))
          if (lido.cnpj && lido.cnpj !== item.cnpj) fornecedor.avisos.push({ nivel: 'vermelho', texto: `O PDF do SICAF é de outro CNPJ (${regras.formatarCnpj(lido.cnpj)}).` })
          // v0.18.2: a razão social do próprio PDF vale mais que a lida na página do SICAF.
          if (lido.razaoSocial) fornecedor.nomeNoSicaf = lido.razaoSocial
        } catch (erro) {
          fornecedor.avisos.push({ nivel: 'amarelo', texto: 'Não consegui ler o PDF do SICAF para conferir o CNPJ.' })
        }
      }
      fornecedores.push(fornecedor)
    }
    mostrarResultadoDoSicaf(fornecedores, pedido)
  }

  function linkDoPdf (bytes) {
    const link = criar('a', { textContent: 'Ver o PDF', target: '_blank', rel: 'noopener' })
    link.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
    return link
  }

  // ---------- Confirmação e inclusão no SEI (v0.14.0) ----------
  // Na CGOC: por fornecedor Sicaf (com o PDF) e Consulta, por nota um Anexo; nas outras unidades, só o
  // Sicaf (etapa 6). Nada é escrito no SEI antes do clique em "Incluir no processo".
  async function mostrarResultadoDoSicaf (fornecedores, pedido) {
    const quais = (pedido && pedido.quais) || (regras.ehCgoc(unidade) ? 'tudo' : 'sicaf')
    const lida = quadroArvore ? seiPedidos.arvoreAberta() : null
    // CNPJ escolhido na CGOC: as notas pendentes desse fornecedor ganham o Anexo.
    if (quais === 'tudo' && lida && !(pedido && pedido.resultado)) {
      try {
        const analise = await analisar()
        for (const fornecedor of fornecedores) {
          if (!fornecedor.notas.length && analise) fornecedor.notas = analise.situacao.notas.filter(nota => nota.cnpj === fornecedor.cnpj && !nota.anexoFeito)
        }
      } catch (erro) {}
    }
    // v0.18.2: última conferência, com a árvore de agora: Sicaf ou Consulta que já está no processo com o
    // CNPJ deste fornecedor não é incluído de novo.
    const existentes = lida ? await jaNoProcesso(lida) : null
    for (const fornecedor of fornecedores) {
      fornecedor.jaTemSicaf = Boolean(existentes && existentes.cnpjsComSicaf.has(fornecedor.cnpj))
      fornecedor.jaTemConsulta = Boolean(existentes && existentes.raizesComConsulta.has(regras.raizDoCnpj(fornecedor.cnpj)))
      fornecedor.temPdf = Boolean(fornecedor.bytes) && !fornecedor.jaTemSicaf
      fornecedor.temSimples = Boolean(fornecedor.simplesBytes) && !fornecedor.jaTemConsulta
    }
    const naoLidos = existentes ? existentes.naoLidos : []
    // v0.16.0: Sicaf, Consulta e Anexo em branco depois da última Folha são preenchidos em vez de criar outros.
    const oQue = { sicaf: quais !== 'simples', simples: quais !== 'sicaf', anexo: quais === 'tudo' }
    const itens = regras.aproveitarEmBranco(regras.documentosParaIncluir(fornecedores, oQue), lida ? lida.documentos : [])
    for (const item of itens) {
      const fornecedor = fornecedores.find(outro => outro.cnpj === item.cnpj)
      if (item.tipo === 'Sicaf') item.arquivo = { bytes: fornecedor.bytes, nome: fornecedor.nomeDoArquivo || regras.nomeDoArquivo(fornecedor.cnpj) }
      if (item.tipo === 'Consulta') item.arquivo = { bytes: fornecedor.simplesBytes, nome: fornecedor.simplesArquivo }
    }
    const nomeDoItem = item => item.tipo + (item.nomeArvore ? ' ' + item.nomeArvore : '')
    const cartoes = fornecedores.map(fornecedor => {
      const doFornecedor = itens.filter(item => item.cnpj === fornecedor.cnpj)
      return criar('div', { className: 'cartao' }, [
        criar('h2', { textContent: regras.formatarCnpj(fornecedor.cnpj) + (fornecedor.nomeNoSicaf ? ' – ' + fornecedor.nomeNoSicaf : '') }),
        !fornecedor.pediuSicaf ? null : fornecedor.erro ? criar('p', { className: 'aviso vermelho', textContent: 'SICAF: ' + fornecedor.erro }) : criar('p', {}, ['PDF do SICAF obtido agora' + (fornecedor.salvo ? ' (cópia na pasta Downloads). ' : '. '), linkDoPdf(fornecedor.bytes)]),
        !fornecedor.pediuSimples ? null : fornecedor.simplesErro ? criar('p', { className: 'aviso vermelho', textContent: 'Simples Nacional: ' + fornecedor.simplesErro }) : criar('p', {}, ['PDF do Simples Nacional obtido agora' + (fornecedor.simplesSalvo ? ' (cópia na pasta Downloads). ' : '. '), linkDoPdf(fornecedor.simplesBytes)]),
        fornecedor.jaTemSicaf ? criar('p', { className: 'aviso verde', textContent: 'O Sicaf deste fornecedor já está no processo: não será incluído de novo.' }) : null,
        fornecedor.jaTemConsulta ? criar('p', { className: 'aviso verde', textContent: 'A Consulta do Simples Nacional deste fornecedor já está no processo: não será incluída de novo.' }) : null,
        ...fornecedor.avisos.map(aviso => criar('p', { className: 'aviso ' + aviso.nivel, textContent: aviso.texto })),
        doFornecedor.length ? criar('p', { className: 'apoio', textContent: 'Será incluído:' }) : null,
        doFornecedor.length ? criar('ul', {}, doFornecedor.map(item => criar('li', { textContent: nomeDoItem(item) + (item.arquivo ? ' (com o PDF)' : '') + (item.emBranco ? (item.nomeArvore || item.arquivo ? ` – no ${item.tipo} em branco ${item.emBranco.sei}` : ` – já existe em branco (${item.emBranco.sei})`) : '') }))) : null
      ])
    })
    // Sicaf ou Consulta do processo que não abriu: não dá para saber de quem é; a pessoa confere.
    if (naoLidos.length) cartoes.push(criar('p', { className: 'aviso amarelo', textContent: 'Não consegui abrir ' + naoLidos.map(doc => doc.rotulo).join(', ') + ' para ver de qual fornecedor é. Confira na árvore antes de incluir.' }))
    const botoesDeFechar = [{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }]
    if (!lida) {
      janela.abrir({ titulo: TITULOS[quais], conteudo: [...cartoes, criar('p', { className: 'apoio', textContent: 'Para incluir no SEI, abra o processo e clique de novo.' })], botoes: botoesDeFechar })
      return
    }
    if (!itens.length) {
      janela.abrir({ titulo: TITULOS[quais], conteudo: cartoes, botoes: botoesDeFechar })
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
  // v0.15.0: "Sempre ligada": botão "Incluir SICAF" em qualquer unidade, com um processo aberto (digitar ou
  // colar o CNPJ). Fora da CGOC inclui só o Sicaf com o PDF; na CGOC, também Consulta e Anexo.
  const ID_INCLUIR = 'incluir-sicaf'
  barra.botao(ID_INCLUIR, { texto: 'Incluir SICAF', titulo: 'Buscar o SICAF de um CNPJ e incluir o PDF neste processo', ordem: 16, aoClicar: () => janelaDoCnpj('', 'sicaf') })
  const desenharIncluir = () => barra.mostrar(ID_INCLUIR, opcoes.incluirSicaf === 'sempre')

  const ID = 'sicaf'
  const botao = barra.botao(ID, { texto: 'Notas sem SICAF', titulo: '', ordem: 15, aoClicar: () => clicou() })
  const escreverNoBotao = texto => { botao.lastChild.textContent = ' ' + texto }
  // v0.18.0: o botão das notas só na CGOC com "Automática"; com "Sempre ligada" fica só o "Incluir SICAF".
  const avisoLigado = () => regras.ehCgoc(unidade) && opcoes.incluirSicaf === 'automatica'

  // ---------- Leitura do processo ----------
  // O que já foi lido não é lido de novo (o documento não muda depois de assinado ou incluído).
  // v0.18.2: só fica guardada a leitura que deu certo; a que falhou (ou Sicaf em branco preenchido depois,
  // com o mesmo número) é lida de novo na próxima vez. Antes a falha ficava guardada até recarregar a página
  // e a nota continuava "sem SICAF".
  const lidos = new Map()
  function lerUmaVez (chave, ler) {
    if (!lidos.has(chave)) {
      const leitura = ler()
      lidos.set(chave, leitura)
      leitura.then(valor => { if (Array.isArray(valor) && !valor.length) lidos.delete(chave) }, () => lidos.delete(chave))
    }
    return lidos.get(chave)
  }
  const lerAteste = doc => lerUmaVez('ateste' + doc.id, () => seiPedidos.pedir(doc.link).then(pagina => regras.lerAteste(regras.textoDoHtml(pagina.html)))).catch(() => [])
  // Texto do PDF (nota, Sicaf, Consulta); null quando não abriu.
  const textoDoDocumento = doc => lerUmaVez('texto' + doc.id, () => seiPedidos.baixarPdf(doc.link).then(bytes => pdfTexto.textoDoPdf(bytes)))
  // CNPJs dentro do PDF do Sicaf ou da Consulta; null quando não abriu (aviso na janela).
  const cnpjsDoDocumento = doc => textoDoDocumento(doc).then(regras.acharCnpjs, erro => {
    console.warn('Extensão IFTO: não consegui ler', doc.rotulo, '-', erro && erro.message)
    return null
  })

  // v0.18.2: Sicaf e Consulta com arquivo depois da última Folha, com os CNPJs de dentro de cada PDF.
  // Usado no aviso, no clique, no CNPJ selecionado e de novo logo antes de incluir.
  async function jaNoProcesso (lida) {
    const inicial = regras.situacaoDoProcesso(lida.documentos)
    const cnpjsDosSicafs = {}
    const cnpjsDasConsultas = {}
    const naoLidos = []
    for (const doc of inicial.sicafs) { const cnpjs = await cnpjsDoDocumento(doc); if (cnpjs) cnpjsDosSicafs[doc.id] = cnpjs; else naoLidos.push(doc) }
    for (const doc of inicial.consultas) { const cnpjs = await cnpjsDoDocumento(doc); if (cnpjs) cnpjsDasConsultas[doc.id] = cnpjs; else naoLidos.push(doc) }
    return {
      inicial,
      cnpjsDosSicafs,
      cnpjsDasConsultas,
      naoLidos,
      cnpjsComSicaf: new Set(Object.values(cnpjsDosSicafs).flat()),
      raizesComConsulta: new Set(Object.values(cnpjsDasConsultas).flat().map(regras.raizDoCnpj))
    }
  }

  // Situação do processo aberto: notas pendentes e o que já existe depois da última Folha.
  async function analisar () {
    const lida = seiPedidos.arvoreAberta()
    if (!lida) return null
    const existentes = await jaNoProcesso(lida)
    const { inicial, cnpjsDosSicafs, cnpjsDasConsultas, cnpjsComSicaf, raizesComConsulta, naoLidos } = existentes
    if (!inicial.notas.length) return { lida, situacao: inicial, cnpjsComSicaf, raizesComConsulta, naoLidos }
    const atestes = {}
    for (const doc of inicial.atestes) atestes[doc.id] = await lerAteste(doc)
    // v0.18.2: CNPJ do emitente lido na própria nota (o mesmo que a busca usa).
    const cnpjsDasNotas = {}
    for (const nota of inicial.notas) cnpjsDasNotas[nota.id] = await textoDoDocumento(nota).then(regras.cnpjsDaNota, () => [])
    const situacao = regras.situacaoDoProcesso(lida.documentos, { atestes, cnpjsDosSicafs, cnpjsDasConsultas, cnpjsDasNotas })
    return { lida, situacao, cnpjsComSicaf, raizesComConsulta, naoLidos }
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
    botao.title = 'Notas fiscais depois da última Folha de Encaminhamento sem SICAF ou Simples Nacional:\n' +
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
      if (!pendentes.length) { window.alert('Este processo não tem notas sem SICAF ou Simples depois da última Folha de Encaminhamento.'); return }
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

  // Texto do PDF da nota (vazio se for imagem) conferido com o ateste.
  // v0.17.3: nota que não abriu tem aviso próprio (antes aparecia como "imagem"); o motivo vai para o console.
  async function conferir (nota) {
    let texto = ''
    let naoLeu = false
    try {
      texto = await textoDoDocumento(nota)
    } catch (erro) {
      naoLeu = true
      console.warn('Extensão IFTO: não consegui ler a nota', nota.sei || nota.id, '-', erro && erro.message)
    }
    const resultado = regras.conferirNota(texto, nota.ateste, { naoLeu })
    return { ...nota, ...resultado, cnpjEscolhido: resultado.cnpj }
  }

  // Janela com cada nota: CNPJ (ou escolha), avisos vermelhos e amarelos. Vermelho pede um segundo clique.
  function janelaDasNotas (notas, resultado) {
    const cartoes = notas.map(nota => cartaoDaNota(nota, resultado))
    const alerta = criar('p', { className: 'aviso vermelho', hidden: true, textContent: 'Há diferenças em vermelho. Confira a nota e o ateste antes de continuar.' })
    const temVermelho = notas.some(nota => nota.avisos.some(aviso => aviso.nivel === 'vermelho'))
    let confirmouVermelho = false
    janela.abrir({
      titulo: regras.textoDoAviso(notas.length),
      conteudo: [criar('p', { className: 'apoio', textContent: 'Notas depois da última Folha de Encaminhamento, conferidas com o ateste. Você pode clicar na árvore do processo com esta janela aberta.' }), ...cartoes, alerta],
      botoes: [
        { texto: 'Cancelar', aoClicar: j => j.fechar() },
        {
          texto: BUSCAR.tudo,
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

  function cartaoDaNota (nota, { cnpjsComSicaf, raizesComConsulta }) {
    const titulo = `Nota ${nota.numero || '?'} – ${nota.fornecedor || 'fornecedor'}` + (nota.sei ? ` (SEI ${nota.sei})` : '')
    const partes = [criar('div', { className: 'linha' }, [criar('h2', { textContent: titulo }), botaoVerNota(nota)])]
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
    if (nota.cnpj && raizesComConsulta.has(regras.raizDoCnpj(nota.cnpj))) partes.push(criar('p', { className: 'aviso verde', textContent: 'Este fornecedor já tem a Consulta do Simples Nacional neste trecho do processo.' }))
    return criar('div', { className: 'cartao' }, partes)
  }

  // v0.17.3: "Ver a nota" abre a nota ao lado da árvore, como o clique na árvore (a janela não tampa mais o SEI).
  function botaoVerNota (nota) {
    const botao = criar('button', { type: 'button', className: 'pequeno', textContent: 'Ver a nota' })
    botao.addEventListener('click', () => {
      let ancora = null
      try { ancora = quadroArvore.contentDocument.getElementById('anchor' + nota.id) } catch (erro) {}
      if (ancora) ancora.click()
      else window.open(nota.link, '_blank', 'noopener')
    })
    return botao
  }

  // v0.13.0: fornecedores conferidos vão para o SICAF (os que já têm Sicaf neste trecho ficam de fora).
  // v0.18.0: e para o Simples Nacional (os que já têm a Consulta com o PDF ficam de fora).
  function buscarFornecedores (grupos, resultado, aberta) {
    const marcados = grupos.map(grupo => ({
      ...grupo,
      precisaSicaf: !resultado.cnpjsComSicaf.has(grupo.cnpj),
      precisaSimples: !resultado.raizesComConsulta.has(regras.raizDoCnpj(grupo.cnpj))
    }))
    const faltam = marcados.filter(grupo => grupo.precisaSicaf || grupo.precisaSimples)
    if (!faltam.length) {
      aberta.trocarConteudo([criar('p', { textContent: 'Todos esses fornecedores já têm Sicaf e Consulta do Simples Nacional neste trecho do processo.' })])
      aberta.trocarBotoes([{ texto: 'Fechar', tipo: 'principal', aoClicar: j => j.fechar() }])
      return
    }
    buscarNoSicaf(faltam, resultado, aberta, 'tudo')
  }

  navegador.storage.onChanged.addListener(async (mudancas, area) => {
    if (area !== 'local' || !mudancas.configuracoes) return
    opcoes = await configuracoes.lerConfiguracoes()
    desenharIncluir()
    atualizarDepois()
  })

  desenharIncluir()
  atualizarDepois()
})()
