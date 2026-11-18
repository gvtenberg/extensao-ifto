// v0.26.0 (spec conferir-documento): conferir o documento do SEI (número do processo, timbre, rodapé) e os
// dados das unidades da pessoa ("Minhas unidades" nas configurações). Regras puras: rodam no navegador e no Node.
(function (raiz) {
  const sohTexto = valor => String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim()

  // Sigla do SEI em maiúsculas e sem espaços ("cgoc / pal/rei/ifto" → "CGOC/PAL/REI/IFTO").
  function siglaDaUnidade (sigla) {
    return String(sigla || '').replace(/\s+/g, '').toUpperCase()
  }

  // Unidade do Campus Palmas: sigla com "/PAL/" (D5) ou a própria "PAL/REI/IFTO".
  function ehUnidadePalmas (sigla) {
    const limpa = siglaDaUnidade(sigla)
    return limpa.includes('/PAL/') || limpa.startsWith('PAL/')
  }

  // Unidade como foi digitada → unidade guardada: sigla limpa, telefone e e-mail sem espaços nas pontas,
  // linhas do setor sem linhas vazias.
  function limparUnidade (unidade) {
    const u = unidade || {}
    const linhas = Array.isArray(u.linhas) ? u.linhas : String(u.linhas || '').split('\n')
    return {
      sigla: siglaDaUnidade(u.sigla),
      telefone: sohTexto(u.telefone),
      email: sohTexto(u.email).toLowerCase(),
      linhas: linhas.map(sohTexto).filter(Boolean)
    }
  }

  // Lista guardada: só unidades com sigla, sem repetir a sigla (fica a última digitada).
  function limparUnidades (unidades) {
    const porSigla = new Map()
    for (const unidade of Array.isArray(unidades) ? unidades : []) {
      const limpa = limparUnidade(unidade)
      if (limpa.sigla) porSigla.set(limpa.sigla, limpa)
    }
    return [...porSigla.values()]
  }

  function acharUnidade (unidades, sigla) {
    const procurada = siglaDaUnidade(sigla)
    return limparUnidades(unidades).find(u => u.sigla === procurada) || null
  }

  // ---- v0.26.2: número do processo (D6, D13, D17) ----
  const ENTIDADES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', ordm: 'º', ordf: 'ª', deg: '°', ndash: '–', mdash: '—', ccedil: 'ç', Ccedil: 'Ç' }
  for (const [letra, acentos] of Object.entries({ a: 'áàâãä', e: 'éèê-ë', i: 'íìî-ï', o: 'óòôõö', u: 'úùû-ü' })) {
    ;['acute', 'grave', 'circ', 'tilde', 'uml'].forEach((nome, i) => {
      if (!acentos[i] || acentos[i] === '-') return
      ENTIDADES[letra + nome] = acentos[i]
      ENTIDADES[letra.toUpperCase() + nome] = acentos[i].toUpperCase()
    })
  }
  // Texto de um pedaço de HTML (sem tags, entidades trocadas, sem caracteres invisíveis, espaços juntados).
  function textoDoHtml (html) {
    return String(html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&([a-z]+);/gi, (tudo, nome) => nome in ENTIDADES ? ENTIDADES[nome] : tudo)
      .replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // NUP: 23236.023147/2026-57 (pontos, barra e traço podem faltar).
  const NUMERO = /(\d{5})\s*\.?\s*(\d{6})\s*\/?\s*(\d{4})\s*-?\s*(\d{2})(?!\d)/
  const soDigitos = texto => String(texto || '').replace(/\D/g, '')
  function formatarProcesso (numero) {
    const d = soDigitos(numero)
    return d.length === 17 ? `${d.slice(0, 5)}.${d.slice(5, 11)}/${d.slice(11, 15)}-${d.slice(15)}` : String(numero || '')
  }
  const mesmoProcesso = (a, b) => soDigitos(a) !== '' && soDigitos(a) === soDigitos(b)

  // Processo em que o documento está: a linha "Referência: Processo nº …" que o SEI põe embaixo do documento
  // (na página do documento e numa seção travada do editor).
  function processoDaReferencia (secoes) {
    for (const secao of secoes || []) {
      const achado = textoDoHtml(secao.html).match(new RegExp('Refer[êe]ncia:?\\s*Processo\\s+n\\S{0,2}\\s*' + NUMERO.source, 'i'))
      if (achado) return formatarProcesso(achado.slice(1, 5).join(''))
    }
    return ''
  }

  // Linha de identificação do alto: "Processo nº: …" (Despacho, Memorando…) ou, no título do Edital e da
  // Minuta, "(Processo Administrativo n° …)". Só os primeiros parágrafos contam (o corpo pode citar outros
  // processos de propósito).
  const LINHA = /^\(?\s*Processo\s+(?:Administrativo\s+)?n\s*[º°o.]?\s*\.?\s*:?\s*/i
  const PARAGRAFOS_DO_ALTO = 20
  function linhaDoProcesso (secoes) {
    let contados = 0
    for (const secao of secoes || []) {
      for (const achado of String(secao.html || '').matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)) {
        const texto = textoDoHtml(achado[0])
        if (!texto) continue
        if (++contados > PARAGRAFOS_DO_ALTO) return null
        const inicio = texto.match(LINHA)
        if (!inicio) continue
        const numero = texto.slice(inicio[0].length).match(NUMERO)
        if (!numero || numero.index > 3) continue
        return {
          secao: secao.nome,
          editavel: secao.editavel !== false,
          numero: formatarProcesso(numero.slice(1, 5).join('')),
          // D17: no Edital o número é um link do SEI: só avisa, sem botão de correção.
          link: /<a\b[^>]*ancora_sei|<a\b/i.test(achado[0]),
          texto
        }
      }
    }
    return null
  }

  // Confere: null quando não há o que conferir (sem a linha ou sem a referência, como no Ofício).
  function conferirProcesso (secoes) {
    const processo = processoDaReferencia(secoes)
    const linha = linhaDoProcesso(secoes)
    if (!processo || !linha) return null
    return { certo: mesmoProcesso(processo, linha.numero), processo, escrito: linha.numero, secao: linha.secao, editavel: linha.editavel, link: linha.link }
  }

  function avisoDoProcesso (conferido) {
    return `O documento está no processo ${conferido.processo}, mas o texto diz ${conferido.escrito}.`
  }

  // v0.26.3 (D2): pergunta antes de assinar.
  function perguntaAntesDeAssinar (conferido) {
    return `O número do processo está errado (documento no processo ${conferido.processo}, texto diz ${conferido.escrito}). Assinar mesmo assim?`
  }

  // Troca só o número na linha "Processo nº:" da seção (primeiro parágrafo que bate). null se não deu.
  function corrigirProcesso (html, processoCerto) {
    let trocado = false
    const novo = String(html || '').replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, paragrafo => {
      if (trocado || !LINHA.test(textoDoHtml(paragrafo))) return paragrafo
      const comNumero = paragrafo.replace(new RegExp(NUMERO.source), () => { trocado = true; return formatarProcesso(processoCerto) })
      return comNumero
    })
    return trocado ? novo : null
  }

  // Documento já assinado: a página do documento mostra "Documento assinado eletronicamente por".
  const estaAssinado = html => /assinado\s+eletronicamente\s+por/i.test(textoDoHtml(html))

  const api = { siglaDaUnidade, ehUnidadePalmas, limparUnidade, limparUnidades, acharUnidade, textoDoHtml, formatarProcesso, mesmoProcesso, processoDaReferencia, linhaDoProcesso, conferirProcesso, avisoDoProcesso, perguntaAntesDeAssinar, corrigirProcesso, estaAssinado }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { conferirDocumento: api })
})(globalThis)
