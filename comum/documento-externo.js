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

  // D14: tipo do documento pelo nome do arquivo. Ordem: 1º o nome de tipo do SEI MAIS LONGO que começa o
  // nome do arquivo ("Nota Fiscal 123.pdf" → "Nota fiscal", não "Nota"); 2º as regras da pessoa; 3º o tipo
  // padrão. tipos: nomes da lista "Tipo do Documento" do SEI. Devolve { tipo, origem, nomeArvore } (tipo
  // null: nada reconhecido). D7: "Nome na Árvore" = o resto do nome ("123") ou o nome sem a extensão.
  function tipoPeloNome (nomeDoArquivo, tipos, { regras = [], padrao = '' } = {}) {
    const semExtensao = String(nomeDoArquivo || '').replace(/\.[^./\\]{1,5}$/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
    const alvo = semAcento(semExtensao)
    const achar = nome => (tipos || []).find(tipo => semAcento(tipo) === semAcento(nome)) || null
    let melhor = null
    for (const tipo of tipos || []) {
      const t = semAcento(tipo)
      if (!t || !alvo.startsWith(t)) continue
      // Depois do nome do tipo vem o fim ou algo que não é letra ("Nota Fiscal 123", "Sicaf-empresa").
      const depois = alvo.charAt(t.length)
      if (depois && /[a-z]/.test(depois)) continue
      if (!melhor || t.length > semAcento(melhor).length) melhor = tipo
    }
    if (melhor) {
      const resto = semExtensao.slice(semAcento(melhor).length).replace(/^[\s\-–—.,;:]+/, '')
      return { tipo: melhor, origem: 'nome', nomeArvore: nomeNaArvore(resto) }
    }
    const nomeArvore = nomeNaArvore(semExtensao)
    for (const regra of regras || []) {
      if (!alvo.includes(semAcento(regra.contem))) continue
      const tipo = achar(regra.tipo)
      if (tipo) return { tipo, origem: 'regra', nomeArvore }
    }
    const tipo = padrao ? achar(padrao) : null
    return { tipo, origem: tipo ? 'padrao' : null, nomeArvore }
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

  const api = { montarPartes, ehDocumentoExternoNovo, ehDocumentoInternoNovo, dataDeHoje, oQuePreencher, semAcento, LIMITE_SEI, DICA_PDF_ACIMA, corrigirNomeDoArquivo, tamanhoEmTexto, avisosDoArquivo, lerRegras, regrasEmTexto, tipoPeloNome }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { documentoExterno: api })
})(globalThis)
