// v0.17.0 (spec consulta-simples, D2): PDF pequeno feito pela própria extensão, com texto de verdade
// (dá para procurar com Ctrl+F no SEI). Fontes padrão do PDF (Helvetica), com acentos (WinAnsiEncoding),
// folha A4, várias páginas quando precisa. Sem serviço de fora; funciona no navegador e no computador (testes).
(function (raiz) {
  // Larguras das letras (milésimos do tamanho da fonte), das tabelas oficiais da Helvetica, do espaço (32) ao "~" (126).
  const LARGURAS = {
    normal: [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584],
    negrito: [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584]
  }
  // Letras fora do ASCII que a WinAnsiEncoding tem em posição diferente do Latin-1.
  const WIN_ANSI = { '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135, 'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152, '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159 }

  function codigoDaLetra (letra) {
    if (WIN_ANSI[letra]) return WIN_ANSI[letra]
    const codigo = letra.codePointAt(0)
    if (codigo >= 32 && codigo <= 126) return codigo
    if (codigo >= 160 && codigo <= 255) return codigo
    return 63 // "?"
  }
  function larguraDaLetra (letra, negrito) {
    const tabela = negrito ? LARGURAS.negrito : LARGURAS.normal
    // Letra com acento: largura da letra sem acento ("ã" = "a").
    const base = letra.normalize('NFD')[0]
    const codigo = base.codePointAt(0)
    if (codigo >= 32 && codigo <= 126) return tabela[codigo - 32]
    if (letra === '–') return 556
    if (letra === '—') return 1000
    return 556
  }
  // Largura de um texto em pontos.
  function larguraDoTexto (texto, tamanho, negrito) {
    let soma = 0
    for (const letra of String(texto)) soma += larguraDaLetra(letra, negrito)
    return soma * tamanho / 1000
  }
  // Texto entre parênteses do PDF, já em WinAnsi (um caractere = um byte).
  function textoDoPdf (texto) {
    let saida = ''
    for (const letra of String(texto).normalize('NFC')) {
      const codigo = codigoDaLetra(letra)
      const caractere = String.fromCharCode(codigo)
      saida += caractere === '(' || caractere === ')' || caractere === '\\' ? '\\' + caractere : caractere
    }
    return '(' + saida + ')'
  }
  // Texto das informações do documento (título): UTF-16 em hexadecimal, aceita qualquer letra.
  function textoUnicode (texto) {
    let hex = 'FEFF'
    for (let i = 0; i < texto.length; i++) hex += texto.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')
    return '<' + hex + '>'
  }

  const ESTILOS = {
    titulo: { tamanho: 14, negrito: true, antes: 0, depois: 10, cor: '0 0 0' },
    secao: { tamanho: 11, negrito: false, antes: 10, depois: 4, cor: '0.15 0.45 0.05', linha: true },
    texto: { tamanho: 10, negrito: false, antes: 0, depois: 3, cor: '0 0 0' },
    nota: { tamanho: 8, negrito: false, antes: 0, depois: 3, cor: '0.4 0.4 0.4' },
    fonte: { tamanho: 8, negrito: false, antes: 14, depois: 0, cor: '0.3 0.3 0.3' }
  }

  // Parágrafo → linhas da folha. Cada parágrafo: { estilo, partes: [{ texto, negrito }] } (ou "texto" só).
  function quebrarParagrafo (paragrafo, larguraMaxima) {
    const estilo = ESTILOS[paragrafo.estilo] || ESTILOS.texto
    const partes = paragrafo.partes || [{ texto: paragrafo.texto || '' }]
    const palavras = []
    for (const parte of partes) {
      const negrito = parte.negrito === undefined ? estilo.negrito : parte.negrito
      for (const palavra of String(parte.texto || '').split(/\s+/).filter(Boolean)) palavras.push({ texto: palavra, negrito })
    }
    const espaco = larguraDoTexto(' ', estilo.tamanho, false)
    const linhas = []
    let atual = []
    let largura = 0
    for (const palavra of palavras) {
      const tamanhoPalavra = larguraDoTexto(palavra.texto, estilo.tamanho, palavra.negrito)
      if (atual.length && largura + espaco + tamanhoPalavra > larguraMaxima) {
        linhas.push(atual)
        atual = []
        largura = 0
      }
      largura += (atual.length ? espaco : 0) + tamanhoPalavra
      atual.push(palavra)
    }
    if (atual.length || !linhas.length) linhas.push(atual)
    // Palavras vizinhas com a mesma fonte viram um pedaço só (o texto fica inteiro no PDF).
    return linhas.map(linha => {
      const pedacos = []
      for (const palavra of linha) {
        const ultimo = pedacos[pedacos.length - 1]
        if (ultimo && ultimo.negrito === palavra.negrito) ultimo.texto += ' ' + palavra.texto
        else pedacos.push({ texto: (ultimo ? ' ' : '') + palavra.texto, negrito: palavra.negrito })
      }
      return pedacos
    })
  }

  // Monta o PDF. Devolve os bytes (Uint8Array).
  function gerarPdf (paragrafos, { titulo = '' } = {}) {
    const LARGURA = 595.28
    const ALTURA = 841.89
    const MARGEM = 50
    const util = LARGURA - 2 * MARGEM
    const paginas = []
    let conteudo = []
    let y = ALTURA - MARGEM
    const novaPagina = () => {
      paginas.push(conteudo)
      conteudo = []
      y = ALTURA - MARGEM
    }
    const n = valor => (Math.round(valor * 100) / 100).toString()

    for (const paragrafo of paragrafos || []) {
      const estilo = ESTILOS[paragrafo.estilo] || ESTILOS.texto
      const altura = estilo.tamanho * 1.3
      const linhas = quebrarParagrafo(paragrafo, util)
      y -= estilo.antes
      for (const linha of linhas) {
        if (y - altura < MARGEM) novaPagina()
        y -= altura
        if (!linha.length) continue
        conteudo.push(`BT ${estilo.cor} rg 1 0 0 1 ${n(MARGEM)} ${n(y)} Tm`)
        for (const pedaco of linha) conteudo.push(`/${pedaco.negrito ? 'F2' : 'F1'} ${estilo.tamanho} Tf ${textoDoPdf(pedaco.texto)} Tj`)
        conteudo.push('ET')
      }
      if (estilo.linha) {
        y -= 3
        conteudo.push(`${estilo.cor} RG 0.5 w ${n(MARGEM)} ${n(y)} m ${n(LARGURA - MARGEM)} ${n(y)} l S`)
      }
      y -= estilo.depois
    }
    if (conteudo.length || !paginas.length) paginas.push(conteudo)

    // Objetos: 1 catálogo, 2 páginas, 3 e 4 fontes, 5 informações, depois página e conteúdo de cada folha.
    const objetos = []
    const fonte = nome => `<< /Type /Font /Subtype /Type1 /BaseFont /${nome} /Encoding /WinAnsiEncoding >>`
    const filhos = paginas.map((_, i) => `${6 + i * 2} 0 R`).join(' ')
    objetos.push('<< /Type /Catalog /Pages 2 0 R >>')
    objetos.push(`<< /Type /Pages /Kids [${filhos}] /Count ${paginas.length} >>`)
    objetos.push(fonte('Helvetica'))
    objetos.push(fonte('Helvetica-Bold'))
    objetos.push(`<< /Title ${textoUnicode(titulo)} /Producer ${textoUnicode('Extensão IFTO')} >>`)
    paginas.forEach((comandos, i) => {
      const fluxo = comandos.join('\n')
      objetos.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGURA} ${ALTURA}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${7 + i * 2} 0 R >>`)
      objetos.push(`<< /Length ${fluxo.length} >>\nstream\n${fluxo}\nendstream`)
    })

    // Um caractere = um byte (o texto já está em WinAnsi), então o tamanho do texto é a posição no arquivo.
    let arquivo = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
    const posicoes = []
    objetos.forEach((objeto, i) => {
      posicoes.push(arquivo.length)
      arquivo += `${i + 1} 0 obj\n${objeto}\nendobj\n`
    })
    const xref = arquivo.length
    arquivo += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
    for (const posicao of posicoes) arquivo += String(posicao).padStart(10, '0') + ' 00000 n \n'
    arquivo += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`

    const bytes = new Uint8Array(arquivo.length)
    for (let i = 0; i < arquivo.length; i++) bytes[i] = arquivo.charCodeAt(i) & 0xff
    return bytes
  }

  const api = { gerarPdf, larguraDoTexto, quebrarParagrafo, textoDoPdf }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { pdfTexto: api })
})(globalThis)
