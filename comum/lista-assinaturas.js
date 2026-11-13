// v0.2.0: lista de assinaturas no SEI (spec lista-assinaturas). Regras puras: ler as linhas coladas,
// saber se a função vale para a unidade aberta e andar pela lista. Testadas no Node.
(function (raiz) {
  const sei = typeof module !== 'undefined' && module.exports ? require('./sei.js') : raiz.ExtensaoIFTO.sei
  // Número do processo do SEI: 23236.021417/2026-95. Documento: número SEI, só algarismos (hoje 7).
  const PROCESSO = /^(\d{5}\.\d{6}\/\d{4}-\d{2})(?![\d/])/
  const DOCUMENTO = /^(\d{6,9})(?!\d)/
  // Separadores aceitos entre as partes: " - ", "–", ";", ",", tabulação (planilha) ou espaço.
  const SEPARADORES = /^[\s\-–—;,]+/
  const MARCADORES = /^[\s•*·]+/
  // v0.9.2: intervalo de documentos: "3383754-3383903", "3383754 - 3383903" ou "3383754 a 3383903".
  const FIM_DO_INTERVALO = /^\s*(?:[-–—]|a|até|ate)\s*(\d{6,9})(?!\d)/i

  function ehCiencia (comentario) {
    const texto = String(comentario || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    return texto.includes('ciencia')
  }

  // Uma linha: "processo - documento comentário", só o processo, ou só o documento (com ou sem comentário).
  function lerLinha (linha) {
    let resto = String(linha || '').replace(MARCADORES, '').trim()
    if (!resto) return null
    let processo = ''
    let documento = ''
    const achouProcesso = PROCESSO.exec(resto)
    if (achouProcesso) {
      processo = achouProcesso[1]
      resto = resto.slice(processo.length).replace(SEPARADORES, '')
    }
    const achouDocumento = DOCUMENTO.exec(resto)
    if (achouDocumento) {
      documento = achouDocumento[1]
      resto = resto.slice(documento.length)
    }
    if (!processo && !documento) return { erro: true }
    let ate = ''
    const achouFim = documento && FIM_DO_INTERVALO.exec(resto)
    if (achouFim) {
      resto = resto.slice(achouFim[0].length)
      // Números invertidos ("3383903 a 3383754") valem do menor ao maior; iguais são um documento só.
      if (Number(achouFim[1]) < Number(documento)) { ate = documento; documento = achouFim[1] } else if (achouFim[1] !== documento) ate = achouFim[1]
    }
    const comentario = resto.replace(SEPARADORES, '').trim()
    const item = { processo, documento, comentario, ciencia: ehCiencia(comentario), feito: false }
    if (ate) item.ate = ate
    return item
  }

  // v0.9.2: números SEI que aparecem nos nomes da árvore do processo: "Despacho 163 (3229092)".
  function numeroDoRotulo (rotulo) {
    const achado = /\((\d{6,9})\)\s*$/.exec(String(rotulo || '').trim())
    return achado ? achado[1] : ''
  }

  // v0.9.2: troca o item de intervalo pelos documentos do processo com número entre o primeiro e o último
  // (nem todos os números seguidos são do mesmo processo), do menor ao maior, um item para cada.
  // v0.9.3: documentos externos (arquivos incluídos) não são assinados no SEI: ficam de fora, a não ser
  // que o item seja de dar ciência (ciência vale para qualquer documento).
  function expandirIntervalo (item, rotulosDaArvore, processoDaArvore, numerosExternos = []) {
    const externos = new Set(item.ciencia ? [] : numerosExternos)
    const inicio = Number(item.documento)
    const fim = Number(item.ate)
    const numeros = [...new Set((rotulosDaArvore || []).map(numeroDoRotulo).filter(Boolean))]
      .filter(numero => Number(numero) >= inicio && Number(numero) <= fim && !externos.has(numero))
      .sort((a, b) => Number(a) - Number(b))
    return numeros.map(documento => ({
      processo: item.processo || processoDaArvore || '',
      documento,
      comentario: item.comentario,
      ciencia: item.ciencia,
      feito: false,
      doIntervalo: `${item.documento} a ${item.ate}`
    }))
  }

  // Texto colado inteiro: itens reconhecidos e linhas não reconhecidas (com o número da linha).
  function lerLista (texto) {
    const itens = []
    const erros = []
    String(texto || '').split(/\r?\n/).forEach((linha, indice) => {
      const item = lerLinha(linha)
      if (!item) return
      if (item.erro) erros.push({ numero: indice + 1, texto: linha.trim() })
      else itens.push(item)
    })
    return { itens, erros }
  }

  // O que digitar na pesquisa rápida do SEI: o documento, se houver; senão, o processo.
  // v0.9.2: intervalo com processo abre o processo (para ler a árvore); sem processo, o primeiro documento.
  function textoDaPesquisa (item) {
    if (item && item.ate && item.processo) return item.processo
    return (item && (item.documento || item.processo)) || ''
  }

  // Opção das configurações: "automatica" (só na Direção-geral), "sempre" ou "desligada".
  const UNIDADE_DIRECAO_GERAL = 'PAL/REI/IFTO'
  function funcaoLigada (opcao, unidade) {
    return sei.ligadaNaUnidade(opcao, unidade, UNIDADE_DIRECAO_GERAL)
  }

  function quantidadeFeitos (itens) {
    return (itens || []).filter(item => item.feito).length
  }

  // "8/28 · 7 feitos" (posição começa em 0).
  function textoDoContador (estado) {
    const total = estado.itens.length
    const feitos = quantidadeFeitos(estado.itens)
    return `${estado.posicao + 1}/${total} · ${feitos} ${feitos === 1 ? 'feito' : 'feitos'}`
  }

  function limitarPosicao (posicao, total) {
    if (!total) return 0
    return Math.min(Math.max(Number(posicao) || 0, 0), total - 1)
  }

  // Próximo item ainda não feito depois da posição atual; se não houver, o primeiro pendente antes dela.
  // Todos feitos: -1.
  function proximoPendente (itens, posicao) {
    for (let i = posicao + 1; i < itens.length; i++) if (!itens[i].feito) return i
    for (let i = 0; i <= posicao && i < itens.length; i++) if (!itens[i].feito) return i
    return -1
  }

  const api = {
    ehCiencia,
    lerLinha,
    lerLista,
    numeroDoRotulo,
    expandirIntervalo,
    textoDaPesquisa,
    UNIDADE_DIRECAO_GERAL,
    funcaoLigada,
    quantidadeFeitos,
    textoDoContador,
    limitarPosicao,
    proximoPendente
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { listaAssinaturas: api })
})(globalThis)
