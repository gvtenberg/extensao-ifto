// v0.22.0 (spec minuta-edital): tirar a marca d'água "MINUTA" de documentos do tipo Edital no editor do SEI.
// A marca não é um parágrafo comum: o SEI Pro põe no texto um bloco de estilo (<style> com
// content: "MINUTA") e uma etiqueta "* MINUTA DE DOCUMENTO". Ao criar o Edital com a minuta como modelo,
// tudo isso vem junto. No SEI 5, apagar a etiqueta não basta: o bloco de estilo fica escondido no texto.
// Regras puras (sem página): funcionam no navegador e no Node.
(function (raiz) {
  const ESTILO = /<style\b[^>]*>[\s\S]*?<\/style>/gi
  const ANCORA = /<span\b[^>]*class\s*=\s*["'][^"']*\bminutaAncora\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi
  const PARAGRAFO = /<p\b[^>]*>([\s\S]*?)<\/p>/gi

  // Bloco de estilo da marca: o do SEI Pro (data-style="seipro-watermark") ou qualquer um que escreva
  // "MINUTA" no fundo (o v2 de 18/11/2026 tinha o bloco sem o data-style).
  function ehEstiloDaMarca (bloco) {
    return /seipro-watermark/i.test(bloco) || /content\s*:\s*(["'])\s*MINUTA\s*\1/i.test(bloco)
  }

  function temMarcaMinuta (html) {
    const texto = String(html || '')
    return (texto.match(ESTILO) || []).some(ehEstiloDaMarca) || new RegExp(ANCORA.source, 'i').test(texto)
  }

  // Tira os blocos de estilo da marca e as etiquetas "MINUTA DE DOCUMENTO" (contadas em "removidas").
  function tirarDoTrecho (trecho, contagem) {
    return trecho
      .replace(ESTILO, bloco => { if (!ehEstiloDaMarca(bloco)) return bloco; contagem.n++; return '' })
      .replace(ANCORA, () => { contagem.n++; return '' })
  }

  // Parágrafo que sobrou vazio (só espaços, &nbsp; e etiquetas vazias) depois de tirar a marca.
  function vazio (trecho) {
    if (/<(img|table|iframe|object|embed|video|audio|svg)\b/i.test(trecho)) return false
    return trecho.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;| /gi, '').trim() === ''
  }

  // Devolve { html, removidas, trechos }: trechos = até 3 pedaços do texto que ainda dizem "minuta"
  // (ex.: o título "minuta de EDITAL"), só para avisar; esses a pessoa corrige à mão.
  function tirarMarcaMinuta (html) {
    const contagem = { n: 0 }
    let limpo = String(html || '').replace(PARAGRAFO, (paragrafo, dentro) => {
      const antes = contagem.n
      const novoDentro = tirarDoTrecho(dentro, contagem)
      if (contagem.n === antes) return paragrafo
      if (vazio(novoDentro)) return ''
      return paragrafo.replace(dentro, () => novoDentro)
    })
    limpo = tirarDoTrecho(limpo, contagem)
    return { html: limpo, removidas: contagem.n, trechos: minutaNoTexto(limpo) }
  }

  function minutaNoTexto (html, maximo = 3) {
    const texto = String(html || '')
      .replace(ESTILO, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
    const trechos = []
    const procura = /minuta/gi
    let achado
    while ((achado = procura.exec(texto)) && trechos.length < maximo) {
      const inicio = Math.max(0, achado.index - 30)
      const fim = Math.min(texto.length, achado.index + 40)
      trechos.push((inicio > 0 ? '…' : '') + texto.slice(inicio, fim).trim() + (fim < texto.length ? '…' : ''))
    }
    return trechos
  }

  // Só em documento do tipo Edital: o título da janela do editor é "SEI/IFTO - 3390039 - Edital Gabinete"
  // (sigla - número - tipo e nome). "Minuta de Edital" fica de fora (lá a marca deve ficar).
  function ehEdital (titulo) {
    const partes = String(titulo || '').split(/\s+[-–]\s+/).slice(1)
    const tipo = partes.find(parte => !/^\d+$/.test(parte.trim())) || ''
    return /^edital\b/i.test(tipo.trim())
  }

  const regrasSei = typeof module !== 'undefined' && module.exports ? require('./sei.js') : raiz.ExtensaoIFTO.sei
  // Opção das configurações: "automatica" (só na Direção-geral), "sempre" ou "desligada".
  function funcaoLigada (opcao, unidade) {
    return regrasSei.ligadaNaUnidade(opcao, unidade, regrasSei.UNIDADE_DIRECAO_GERAL)
  }

  const api = { temMarcaMinuta, tirarMarcaMinuta, minutaNoTexto, ehEdital, funcaoLigada }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { minutaEdital: api })
})(globalThis)
