// v0.23.0 (spec data-documento): no Ofício e na Portaria o SEI põe a data ao criar o documento, numa seção
// que não dá para editar ("Data", somente leitura). Estas regras acham essa data, dizem se já passou e a
// trocam pela de hoje, mantendo cidade, pontuação e letras maiúsculas. Regras puras (sem página).
(function (raiz) {
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const ESPACO = '(?:\\s|&nbsp;|&#160;| )+'
  // "março" pode vir como "mar&ccedil;o" do editor antigo (CKEditor 4).
  const NOMES = MESES.map(mes => mes.replace('ç', '(?:ç|&ccedil;)')).join('|')
  const DATA = new RegExp('(\\d{1,2})(º|°|&ordm;|&deg;|o)?' + ESPACO + 'de' + ESPACO + '(' + NOMES + ')' + ESPACO + 'de' + ESPACO + '(\\d{4})', 'i')

  const regrasSei = typeof module !== 'undefined' && module.exports ? require('./sei.js') : raiz.ExtensaoIFTO.sei
  function ehOficioOuPortaria (titulo) {
    return /^(of[ií]cio|portaria)\b/i.test(regrasSei.tipoDoDocumento(titulo))
  }

  // Primeira data "28 de abril de 2026" do texto: { dia, mes (1 a 12), ano, trecho, inicio } ou null.
  function acharData (html) {
    const achado = DATA.exec(String(html || ''))
    if (!achado) return null
    const nome = achado[3].toLowerCase().replace('&ccedil;', 'ç')
    return { dia: Number(achado[1]), mes: MESES.indexOf(nome) + 1, ano: Number(achado[4]), trecho: achado[0], inicio: achado.index, achado }
  }

  // A data do documento é de um dia antes de hoje?
  function dataPassou (data, hoje = new Date()) {
    if (!data) return false
    const doDocumento = data.ano * 10000 + data.mes * 100 + data.dia
    return doDocumento < hoje.getFullYear() * 10000 + (hoje.getMonth() + 1) * 100 + hoje.getDate()
  }

  const doisDigitos = numero => String(numero).padStart(2, '0')
  const dataCurta = data => doisDigitos(data.dia) + '/' + doisDigitos(data.mes) + '/' + data.ano
  const dataPorExtenso = hoje => hoje.getDate() + ' de ' + MESES[hoje.getMonth()] + ' de ' + hoje.getFullYear()

  // ---- v0.26.9 (spec conferir-documento, etapa 8): conferir a data de todo documento ainda não assinado ----
  // Data do documento: a linha "Cidade, D de mês de AAAA." (no alto ou no fim do corpo, onde o setor a pôs) ou
  // o fim do título ("PORTARIA … nº 1/2026, de 18 de novembro de 2026", "EDITAL Nº 75/2026…, DE 18 DE …").
  // Datas citadas no corpo (leis, portarias) nunca entram.
  const ACENTOS = { acute: '\u0301', grave: '\u0300', tilde: '\u0303', circ: '\u0302', uml: '\u0308', cedil: '\u0327' }
  const ENTIDADES = { nbsp: ' ', ordm: 'º', deg: '°', amp: '&', quot: '"', apos: "'", ordf: 'ª' }
  function textoDoParagrafo (html) {
    return String(html || '')
      // v0.26.11 (etapa 7): blocos de estilo escondidos (espaçamento, numeração, MINUTA) não são texto.
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&([a-z])(acute|grave|tilde|circ|uml|cedil);/gi, (_, letra, acento) => letra + ACENTOS[acento])
      .replace(/&([a-z]+);/gi, (tudo, nome) => nome in ENTIDADES ? ENTIDADES[nome] : tudo)
      .normalize('NFC')
      .replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  const DATA_NO_TEXTO = '(\\d{1,2})\\s*(º|°|o)?\\s+de\\s+(' + MESES.join('|') + ')\\s+de\\s+(\\d{4})'
  const LINHA_DA_CIDADE = new RegExp("^[A-Za-zÀ-ÿ'’ .-]{2,40},\\s*" + DATA_NO_TEXTO + '\\s*(\\.?)$', 'i')
  const FIM_DO_TITULO = new RegExp('\\bn\\s*[º°o]\\.?\\s*\\S.*\\bde\\s+' + DATA_NO_TEXTO + '\\s*\\.?$', 'i')
  const PARAGRAFOS_DO_TITULO = 15

  // v0.26.11 (etapa 7, D21): o texto (já sem tags) é a linha "Cidade, D de mês de AAAA."?
  const ehLinhaDaData = texto => LINHA_DA_CIDADE.test(String(texto || '').replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/\s+/g, ' ').trim())

  // Todas as datas do documento: [{ secao, editavel, tipo ('cidade' | 'titulo'), texto, dia, mes, ano,
  // diaEscrito, ordinal, mesEscrito, ponto }].
  function datasDoDocumento (secoes) {
    const datas = []
    let contados = 0
    for (const secao of secoes || []) {
      const html = String(secao.html || '')
      const paragrafos = [...html.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)].map(achado => achado[0])
      for (const paragrafo of paragrafos.length ? paragrafos : [html]) {
        const texto = textoDoParagrafo(paragrafo)
        if (!texto) continue
        contados++
        if (texto.length > 250) continue
        let achado = texto.match(LINHA_DA_CIDADE)
        let tipo = 'cidade'
        if (!achado && contados <= PARAGRAFOS_DO_TITULO) {
          achado = texto.match(FIM_DO_TITULO)
          // Título começa com o tipo em maiúsculas ("PORTARIA …", "EDITAL …"); "Conforme a Portaria nº …" é corpo.
          if (achado && /[a-zà-ÿ]/.test(texto.slice(0, texto.search(/\bn\s*[º°o]/i)))) achado = null
          tipo = 'titulo'
        }
        if (!achado) continue
        datas.push({
          secao: secao.nome,
          editavel: secao.editavel !== false,
          tipo,
          texto,
          dia: Number(achado[1]),
          mes: MESES.indexOf(achado[3].toLowerCase()) + 1,
          ano: Number(achado[4]),
          diaEscrito: achado[1],
          ordinal: achado[2] || '',
          mesEscrito: achado[3],
          ponto: tipo === 'cidade' ? achado[5] === '.' : true
        })
      }
    }
    return datas
  }

  // Data no padrão: "1º de dezembro de 2026", "2 de novembro de 2026" (sem zero na frente).
  const dataEscrita = (dia, mes, ano) => (dia === 1 ? '1º' : String(dia)) + ' de ' + MESES[mes - 1] + ' de ' + ano
  const dataDeHoje = hoje => ({ dia: hoje.getDate(), mes: hoje.getMonth() + 1, ano: hoje.getFullYear() })
  const valor = data => data.ano * 10000 + data.mes * 100 + data.dia

  // Confere as datas (só em documento ainda não assinado; a comparação é com hoje). Errada: mês ou ano
  // diferentes dos de hoje, um dia que ainda não chegou ou que já passou (v0.34.2: em todo tipo de documento;
  // antes, só no Ofício e na Portaria). Fora do padrão: zero na frente do dia, "1" sem "º", "º" em outro dia
  // e, na linha "Cidade, data", mês com letra maiúscula ou sem o ponto final.
  // Devolve null (sem data), a primeira data com problema { certo: false, errada, problemas, escrita, hoje,
  // nova, … } ou, se todas estão certas, a primeira { certo: true, … }.
  function conferirData (secoes, hoje = new Date()) {
    const datas = datasDoDocumento(secoes)
    if (!datas.length) return null
    const atual = dataDeHoje(hoje)
    const hojeEscrito = dataEscrita(atual.dia, atual.mes, atual.ano)
    for (const data of datas) {
      const escrita = dataEscrita(data.dia, data.mes, data.ano)
      const problemas = []
      let errada = true
      if (data.ano !== atual.ano || data.mes !== atual.mes) problemas.push(`O mês ou o ano está errado: o texto diz ${escrita}, mas hoje é ${hojeEscrito}.`)
      else if (valor(data) > valor(atual)) problemas.push(`A data ainda não chegou: o texto diz ${escrita}, mas hoje é ${hojeEscrito}.`)
      else if (valor(data) < valor(atual)) problemas.push(`A data já passou: o texto diz ${escrita}, mas hoje é ${hojeEscrito}.`)
      else errada = false
      if (/^0/.test(data.diaEscrito)) problemas.push(`Escreva o dia sem o zero na frente ("${data.dia} de", não "${data.diaEscrito} de").`)
      if (data.dia === 1 && data.ordinal !== 'º') problemas.push('No primeiro dia do mês, escreva "1º de".')
      if (data.dia !== 1 && data.ordinal) problemas.push(`Só o dia 1 leva o "º" (escreva "${data.dia} de").`)
      if (data.tipo === 'cidade' && data.mesEscrito !== data.mesEscrito.toLowerCase()) problemas.push(`Escreva o mês com letra minúscula ("${MESES[data.mes - 1]}").`)
      if (!data.ponto) problemas.push('Falta o ponto final depois do ano.')
      if (!problemas.length) continue
      const nova = errada ? hojeEscrito : escrita
      return { ...data, certo: false, errada, problemas, escrita, hoje: hojeEscrito, nova }
    }
    return { ...datas[0], certo: true, errada: false, problemas: [], escrita: dataEscrita(datas[0].dia, datas[0].mes, datas[0].ano), hoje: hojeEscrito }
  }

  // Frase curta para a janela antes de assinar (só quando a data está errada, não só fora do padrão).
  const fraseAntesDeAssinar = conferido => `Data: o texto diz ${conferido.escrita}, mas hoje é ${conferido.hoje}.`

  // Corrige a data conferida no HTML da seção: a de hoje (se estava errada) ou a mesma data no padrão; "DE"
  // e mês em maiúsculas continuam assim (títulos); na linha "Cidade, data" põe o ponto final que faltava.
  // Devolve o HTML novo ou null (data não achada no HTML).
  function corrigirData (html, conferido) {
    const texto = String(html || '')
    for (const achado of texto.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)) {
      if (textoDoParagrafo(achado[0]) !== conferido.texto) continue
      const paragrafo = achado[0]
      const data = DATA.exec(paragrafo)
      if (!data) return null
      const [dia, mes, ano] = (conferido.nova.match(/^(\d+)º? de (\S+) de (\d{4})$/) || []).slice(1)
      const maiusculas = data[3] === data[3].toUpperCase()
      const novo = data[0].replace(/^\d{1,2}(?:º|°|&ordm;|&deg;|o)?/i, Number(dia) === 1 ? '1º' : dia)
        .replace(new RegExp('(' + NOMES + ')', 'i'), maiusculas ? mes.toUpperCase() : mes)
        .replace(/\d{4}$/, ano)
      const depois = paragrafo.slice(data.index + data[0].length)
      const ponto = conferido.tipo === 'cidade' && !/^(?:<[^>]*>|\s|&nbsp;)*\./.test(depois) ? '.' : ''
      const corrigido = paragrafo.slice(0, data.index) + novo + ponto + depois
      return texto.slice(0, achado.index) + corrigido + texto.slice(achado.index + paragrafo.length)
    }
    return null
  }

  const api = { ehOficioOuPortaria, ehLinhaDaData, acharData, dataPassou, dataCurta, dataPorExtenso, textoDoParagrafo, datasDoDocumento, dataEscrita, conferirData, fraseAntesDeAssinar, corrigirData }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { dataDocumento: api })
})(globalThis)
