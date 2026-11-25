// v0.6.0: regras do documento externo do SEI (spec documentos-pagamento), sem depender da página.
(function (raiz) {
  // v0.27.0: "Nome na Árvore" de até 50 letras (mesma regra do SICAF).
  const { nomeNaArvore } = typeof module !== 'undefined' && module.exports ? require('./sei.js') : raiz.ExtensaoIFTO.sei
  // Documento externo NOVO: página "documento_receber". O que já existe (com ou sem arquivo) abre em
  // "documento_alterar_recebido" e nunca é alterado pela extensão.
  function ehDocumentoExternoNovo (endereco) {
    let acao
    try { acao = new URL(endereco, 'https://sei.ifto.edu.br/').searchParams.get('acao') } catch (erro) { return false }
    return acao === 'documento_receber'
  }

  // v0.22.2: documento interno NOVO (Edital, Despacho…): página "documento_gerar". Só o nível Público é
  // marcado (documento interno não tem data nem formato para preencher); o que já existe abre em "documento_alterar".
  function ehDocumentoInternoNovo (endereco) {
    let acao
    try { acao = new URL(endereco, 'https://sei.ifto.edu.br/').searchParams.get('acao') } catch (erro) { return false }
    return acao === 'documento_gerar'
  }

  // v0.33.0: processo NOVO (Iniciar Processo e Iniciar Processo Relacionado): só o nível Público, como no
  // documento interno novo.
  function ehProcessoNovo (endereco) {
    let acao
    try { acao = new URL(endereco, 'https://sei.ifto.edu.br/').searchParams.get('acao') } catch (erro) { return false }
    return acao === 'procedimento_gerar' || acao === 'procedimento_gerar_relacionado'
  }

  // Data no formato do SEI: dd/mm/aaaa.
  function dataDeHoje (agora = new Date()) {
    const dois = n => String(n).padStart(2, '0')
    return `${dois(agora.getDate())}/${dois(agora.getMonth() + 1)}/${agora.getFullYear()}`
  }

  // O que falta preencher, a partir do estado dos campos (só os vazios ou sem marcação).
  function oQuePreencher ({ data, formatoMarcado, nivelMarcado }) {
    return {
      data: !String(data || '').trim(),
      formato: !formatoMarcado,
      nivel: !nivelMarcado
    }
  }


  // v0.27.0 (spec base-e-sei, etapa 2): arquivo escolhido no documento externo (e arrastado para a árvore,
  // etapa 3). Limite do SEI: 10 MiB = 10.485.760 bytes (D10, teste T07; o SEI chama de "10Mb").
  const LIMITE_SEI = 10 * 1024 * 1024
  // D12: PDF acima de 2 MB recebe só a dica de diminuir (nunca bloqueia).
  const DICA_PDF_ACIMA = 2 * 1024 * 1024
  const PDF24 = { texto: 'pdf24.org', endereco: 'https://tools.pdf24.org/pt/comprimir-pdf' }
  const ILOVEPDF = { texto: 'ilovepdf.com', endereco: 'https://www.ilovepdf.com/pt/comprimir_pdf' }

  // D9 (teste T06): o SEI só recusa "#" no nome do arquivo; vira "_". Acentos e o resto ficam.
  function corrigirNomeDoArquivo (nome) {
    return String(nome || '').replace(/#/g, '_')
  }

  // "12,3 MB" (mesma conta do SEI: 1 MB = 1.048.576 bytes).
  function tamanhoEmTexto (bytes) {
    const mb = Number(bytes || 0) / (1024 * 1024)
    return (mb < 0.1 ? '0,1' : mb.toFixed(1).replace('.', ',')) + ' MB'
  }

  const ehPdf = nome => /\.pdf$/i.test(String(nome || ''))

  // Avisos sobre o arquivo: [{ nivel: 'erro' | 'dica', partes: [texto | { texto, endereco }] }].
  // "erro" = acima do limite: o SEI recusa, então a extensão não envia (D10, D11, D13: as duas dicas sempre).
  function avisosDoArquivo ({ nome, tamanho }) {
    const avisos = []
    const quanto = tamanhoEmTexto(tamanho)
    if (tamanho > LIMITE_SEI) {
      const partes = [`O arquivo "${nome}" tem ${quanto} e o SEI só aceita até 10 MB. `]
      // P4: o ilovepdf falha em PDF com imagens ou texto que ele não comprime; o pdf24.org resolveu todos.
      if (ehPdf(nome)) partes.push('Diminua o PDF antes de anexar: ', PDF24, ' (diminui mais, até PDF com imagens) ou ', ILOVEPDF, ' (mais rápido).')
      else partes.push('Compacte o arquivo (.zip) ou salve a planilha ou a imagem como PDF e diminua o PDF no ', PDF24, '.')
      avisos.push({ nivel: 'erro', partes })
    } else if (ehPdf(nome) && tamanho > DICA_PDF_ACIMA) {
      avisos.push({ nivel: 'dica', partes: [`Dica: o PDF "${nome}" tem ${quanto}. Para ocupar menos espaço no SEI, dá para diminuí-lo no `, PDF24, ' ou no ', ILOVEPDF, ' antes de anexar.'] })
    }
    return avisos
  }

  // Comparação sem acentos, maiúsculas, "_" e espaços repetidos ("Nota_fiscal" = "nota fiscal").
  function semAcento (texto) {
    return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
  }

  // Regras próprias da pessoa ("contém SICAF → Sicaf"): uma por linha, "palavra = Tipo".
  function lerRegras (texto) {
    const regras = []
    for (const linha of String(texto || '').split(/\r?\n/)) {
      const posicao = linha.indexOf('=')
      if (posicao < 0) continue
      const contem = linha.slice(0, posicao).trim()
      const tipo = linha.slice(posicao + 1).trim()
      if (contem && tipo) regras.push({ contem, tipo })
    }
    return regras
  }
  const regrasEmTexto = regras => (regras || []).map(regra => `${regra.contem} = ${regra.tipo}`).join('\n')

  // v0.36.1: onde termina, no começo do nome do arquivo, o nome do tipo (0 = não começa com ele). Não faz
  // diferença maiúscula, acento, "-", "_" ou outro sinal entre as palavras, nem a letra com acento estragada pela
  // codificação do Windows ("RelatÃ³rio", "Relat¢rio", "Relat?rio"). Depois do nome vem o fim, algo que não é
  // letra ("Nota Fiscal 123", "portaria_") ou uma maiúscula logo depois de minúscula ("ConsultaOptantes", T170).
  const LETRAS = { a: 'aáàâãä', e: 'eéèêë', i: 'iíìîï', o: 'oóòôõö', u: 'uúùûü', c: 'cç', n: 'nñ' }
  function fimDoComeco (nome, tipo) {
    const padrao = (String(tipo || '').normalize('NFC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).map(palavra => [...palavra].map(letra => {
      const base = semAcento(letra)
      const iguais = LETRAS[base] ? '[' + LETRAS[base] + ']' : base
      return letra === base ? iguais : '(?:' + iguais + '|' + base + '[^\\x00-\\x7f]{1,3}|[^\\x00-\\x7f]{1,4}|[?_])'
    }).join('')).join('[^\\p{L}\\p{N}]+')
    if (!padrao) return 0
    const achado = new RegExp('^' + padrao, 'iu').exec(nome)
    if (!achado) return 0
    const fim = achado[0].length
    const junto = /\p{Ll}$/u.test(achado[0]) && /^\p{Lu}/u.test(nome.slice(fim))
    return /^\p{L}/u.test(nome.slice(fim)) && !junto ? 0 : fim
  }

  // D14: tipo do documento pelo nome do arquivo. Ordem: 1º o nome de tipo do SEI MAIS LONGO que começa o
  // nome do arquivo ("Nota Fiscal 123.pdf" → "Nota fiscal", não "Nota"); 2º as regras da pessoa; 3º o tipo
  // padrão. tipos: nomes da lista "Tipo do Documento" do SEI. Devolve { tipo, origem, nomeArvore } (tipo
  // null: nada reconhecido). D7: "Nome na Árvore" = o resto do nome ("123") ou o nome sem a extensão.
  function tipoPeloNome (nomeDoArquivo, tipos, { regras = [], padrao = '' } = {}) {
    // v0.36.1: sinal no começo não conta ("_portaria"); acento em letra separada (Mac) vira uma letra só.
    const bruto = String(nomeDoArquivo || '').replace(/\.[^./\\]{1,5}$/, '').normalize('NFC').replace(/^[\x00-\x2f:-@[-`{-\x7f\s]+/, '')
    const limpar = texto => texto.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
    const semExtensao = limpar(bruto)
    const alvo = semAcento(semExtensao)
    const achar = nome => (tipos || []).find(tipo => semAcento(tipo) === semAcento(nome)) || null
    let melhor = null
    let fimDoMelhor = 0
    for (const tipo of tipos || []) {
      const fim = fimDoComeco(bruto, tipo)
      if (fim && (!melhor || semAcento(tipo).length > semAcento(melhor).length)) { melhor = tipo; fimDoMelhor = fim }
    }
    if (melhor) {
      const resto = limpar(bruto.slice(fimDoMelhor)).replace(/^[\s\-–—.,;:]+/, '')
      return { tipo: melhor, origem: 'nome', nomeArvore: nomeNaArvore(resto) }
    }
    const nomeArvore = nomeNaArvore(semExtensao)
    for (const regra of regras || []) {
      if (!alvo.includes(semAcento(regra.contem))) continue
      const tipo = achar(regra.tipo)
      if (tipo) return { tipo, origem: 'regra', nomeArvore }
    }
    const tipo = padrao ? achar(padrao) : null
    if (tipo) return { tipo, origem: 'padrao', nomeArvore }
    // v0.36.1 (usuário, 25/11/2026): o nome só diz o começo ("portaria_12" e o SEI tem quatro portarias): nada é
    // escolhido, mas esses tipos são mostrados primeiro.
    const sugestoes = (tipos || []).filter(item => {
      const primeira = (String(item).match(/[\p{L}\p{N}]+/u) || [''])[0]
      return primeira.length > 2 && fimDoComeco(bruto, primeira)
    })
    return sugestoes.length ? { tipo: null, origem: null, nomeArvore, sugestoes } : { tipo: null, origem: null, nomeArvore }
  }

  // v0.27.1 (etapa 3): arquivo arrastado para a árvore, pronto para a lista de conferência. arquivo: { nome,
  // tamanho, modificado (milissegundos) }; tipos: nomes da lista do SEI; opcoes: as configurações.
  // bloqueado = não pode ir para o SEI (acima do limite, ou "#" no nome com a troca desligada).
  function prepararArquivo (arquivo, tipos, opcoes = {}) {
    const avisos = avisosDoArquivo({ nome: arquivo.nome, tamanho: arquivo.tamanho })
    let nome = arquivo.nome
    if (nome.includes('#')) {
      if (opcoes.externoCorrigirNome === false) avisos.push({ nivel: 'erro', partes: ['O SEI não aceita "#" no nome do arquivo. Renomeie o arquivo no computador, sem "#", e arraste de novo.'] })
      else {
        nome = corrigirNomeDoArquivo(nome)
        avisos.push({ nivel: 'dica', partes: [`O SEI não aceita "#" no nome: o arquivo vai como "${nome}".`] })
      }
    }
    const achado = tipoPeloNome(arquivo.nome, tipos, { regras: opcoes.externoRegras, padrao: opcoes.externoTipoPadrao })
    const data = opcoes.arrastarDataDoArquivo && arquivo.modificado ? dataDeHoje(new Date(arquivo.modificado)) : dataDeHoje()
    return {
      nome,
      avisos,
      bloqueado: avisos.some(aviso => aviso.nivel === 'erro'),
      tipo: achado.tipo,
      origem: achado.origem,
      sugestoes: achado.sugestoes || [],
      nomeArvore: opcoes.externoNomeArvore === false ? '' : achado.nomeArvore,
      data
    }
  }

  // Partes de um aviso em elementos da página (os links abrem em outra aba). Usado na página do documento
  // externo (etapa 2) e na lista dos arquivos arrastados (etapa 3).
  function montarPartes (partes, documento) {
    const fragmento = documento.createDocumentFragment()
    for (const parte of partes) {
      if (typeof parte === 'string') { fragmento.append(parte); continue }
      const link = documento.createElement('a')
      link.href = parte.endereco
      link.target = '_blank'
      link.rel = 'noopener'
      link.textContent = parte.texto
      fragmento.append(link)
    }
    return fragmento
  }

  // Aviso no alto do formulário. nivel: "feito" (verde), "dica" (amarelo) ou "erro" (vermelho). v0.36.0: saiu de
  // sites/sei/documento-externo.js, para servir também a duplicar documento.
  function avisarNoFormulario (documento, texto, nivel, marca) {
    const destino = documento.getElementById('frmDocumentoCadastro')
    if (!destino) return
    const cores = {
      feito: ['#E8F5EC', '#1E5631', '#B7DCC3'],
      dica: ['#FFF1D6', '#7A4B00', '#F0D49A'],
      erro: ['#FDECEC', '#8A1C1C', '#F2B8B8']
    }[nivel] || ['#E8F5EC', '#1E5631', '#B7DCC3']
    const nota = documento.createElement('div')
    nota.dataset.extensaoIfto = marca
    nota.append(montarPartes(Array.isArray(texto) ? texto : [texto], documento))
    Object.assign(nota.style, {
      margin: '6px 0', padding: '6px 10px', borderRadius: '4px', maxWidth: '90%',
      background: cores[0], color: cores[1], border: '1px solid ' + cores[2], fontWeight: '600', width: 'fit-content'
    })
    destino.prepend(nota)
  }

  // v0.36.0: formulário aberto por "Duplicar documento" (sites/sei/duplicar-documento.js marca a página
  // principal ao abrir e o formulário ao carregar): o nível de acesso é o do original.
  function ehDuplicado (janela) {
    try {
      if (janela.document.documentElement.dataset.extensaoIftoDuplicado) return true
      return janela.top.document.documentElement.dataset.extensaoIftoDuplicar === janela.location.href
    } catch (erro) { return false }
  }

  // v0.32.0: documento externo em branco aberto à direita (endereço do quadro com id_documento): só se a árvore
  // diz que ele não tem arquivo e tem o link "Alterar Documento Externo". null se não for o caso.
  function externoEmBranco (documentos, enderecoDaPagina) {
    let id
    try { id = new URL(enderecoDaPagina).searchParams.get('id_documento') } catch (erro) { return null }
    const doc = id && (documentos || []).find(item => item.id === id)
    if (!doc || !doc.semConteudo || doc.temArquivo || !doc.linkAlterar) return null
    const sei = (/\((\d+)\)\s*$/.exec(doc.rotulo || '') || [])[1] || ''
    return { id, sei, rotulo: doc.rotulo, linkAlterar: doc.linkAlterar }
  }

  const api = { externoEmBranco, prepararArquivo, montarPartes, avisarNoFormulario, ehDuplicado, ehDocumentoExternoNovo, ehDocumentoInternoNovo, ehProcessoNovo, dataDeHoje, oQuePreencher, semAcento, LIMITE_SEI, DICA_PDF_ACIMA, corrigirNomeDoArquivo, tamanhoEmTexto, avisosDoArquivo, lerRegras, regrasEmTexto, tipoPeloNome }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { documentoExterno: api })
})(globalThis)
