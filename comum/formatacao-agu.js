// v0.38.0 (spec remover-formatacao-agu): regras puras do botão "Remover Formatação da AGU" (sem página: valem no
// navegador e no Node). Os documentos da licitação voltam da AGU com texto riscado, colorido, marcado e com os
// parágrafos "Justificativa Modificação Item(ns)"; aqui fica só o que decide o que sai e como o texto se junta.
(function (raiz) {
  // Caractere que o editor usa no lugar de um objeto (imagem, quebra de linha) ao montar o texto do parágrafo.
  const OBJETO = '￼'

  // Sem acento, minúsculas, espaços (inclusive o "&nbsp;") juntos num só.
  function normalizar (texto) {
    return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s\u00a0]+/g, ' ').trim().toLowerCase()
  }

  // D6 (a): parágrafo cujo texto inteiro é "Justificativa Modificação Item(ns)" (espaços, maiúsculas e acentos
  // não contam; um ponto ou dois-pontos no fim também não).
  function ehJustificativa (texto) {
    return normalizar(String(texto || '').split(OBJETO).join(' ')).replace(/\s*[.:]$/, '') === 'justificativa modificacao item(ns)'
  }

  // D6 (a): ligação de comentário do Word ("#_msocom_1") que veio no texto colado.
  function ehLinkComentarioWord (endereco) {
    return /^#_msocom_\d+$/i.test(String(endereco || '').trim())
  }

  // Texto dentro da ligação do Word que também sai: só espaços ou a marca do comentário ("[A1]", "[GPO1]").
  function textoDoLinkSai (texto) {
    return /^[\s\u00a0]*(\[[^\]]{0,12}\])?[\s\u00a0]*$/.test(String(texto || ''))
  }

  const NOMES_PRETOS = ['black', 'windowtext', 'windowframe', 'buttontext', 'canvastext', 'initial', 'unset', 'inherit', 'auto', 'currentcolor', 'revert']

  // Lê "#f00", "#FF0000", "rgb(0, 0, 0)", "hsl(0,0%,0%)" e nomes; devolve [r, g, b] (0 a 255) ou null.
  function lerCor (valor) {
    const texto = String(valor || '').trim().toLowerCase()
    const nomes = { black: [0, 0, 0], white: [255, 255, 255], red: [255, 0, 0], blue: [0, 0, 255], green: [0, 128, 0] }
    if (nomes[texto]) return nomes[texto]
    let achado = texto.match(/^#([0-9a-f]{3})$/)
    if (achado) return achado[1].split('').map(letra => parseInt(letra + letra, 16))
    achado = texto.match(/^#([0-9a-f]{6})$/)
    if (achado) return [0, 2, 4].map(inicio => parseInt(achado[1].slice(inicio, inicio + 2), 16))
    achado = texto.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (achado) return achado.slice(1, 4).map(Number)
    achado = texto.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/)
    if (achado) return deHsl(Number(achado[1]), Number(achado[2]) / 100, Number(achado[3]) / 100)
    return null
  }

  function deHsl (matiz, saturacao, luz) {
    const k = n => (n + matiz / 30) % 12
    const a = saturacao * Math.min(luz, 1 - luz)
    const canal = n => luz - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return [0, 8, 4].map(n => Math.round(canal(n) * 255))
  }

  // D5 e D9 (26/11/2026): "preta" (já sai preta: nada a contar), "branca" (texto invisível: é apagado) ou
  // "colorida" (fica preta). Cor que não dá para ler conta como colorida.
  function tipoDaCor (valor) {
    const texto = String(valor || '').trim().toLowerCase()
    if (!texto || NOMES_PRETOS.includes(texto)) return 'preta'
    const cor = lerCor(texto)
    if (!cor) return 'colorida'
    if (cor.every(canal => canal <= 16)) return 'preta'
    if (cor.every(canal => canal >= 245)) return 'branca'
    return 'colorida'
  }

  // D3: ao tirar um trecho riscado, as palavras de cada lado podem colar ("valorestimado"). antes = último
  // caractere antes do trecho, depois = primeiro depois ('' no começo ou no fim do parágrafo).
  // inserir: põe um espaço; tirar: dois espaços ficaram juntos, tira o primeiro depois do trecho.
  function espacoAoJuntar (antes, depois) {
    const espaco = c => /[\s\u00a0]/.test(c)
    if (!antes || !depois || antes === OBJETO || depois === OBJETO) return { inserir: false, tirar: false }
    if (espaco(antes) && espaco(depois)) return { inserir: false, tirar: true }
    if (espaco(antes) || espaco(depois)) return { inserir: false, tirar: false }
    if (/[([{“"'‘«/-]/.test(antes)) return { inserir: false, tirar: false }
    if (/[,.;:!?)\]}”"'’»/-]/.test(depois)) return { inserir: false, tirar: false }
    return { inserir: true, tirar: false }
  }

  // D4: o parágrafo ficou sem texto depois de tirar o riscado (espaços não contam; imagem ou outro objeto conta).
  function ficouSemTexto (texto) {
    return !String(texto || '').replace(/[\s\u00a0]+/g, '')
  }

  // Linha da lista de revisão: o trecho riscado com algumas palavras de cada lado.
  function trechoComVolta (antes, trecho, depois, palavras = 5) {
    const limpo = t => String(t || '').split(OBJETO).join(' ').replace(/[\s\u00a0]+/g, ' ')
    const textoAntes = limpo(antes)
    const textoDepois = limpo(depois)
    const ladoAntes = textoAntes.trim().split(' ').filter(Boolean)
    const ladoDepois = textoDepois.trim().split(' ').filter(Boolean)
    // O espaço junto do trecho fica, para a linha mostrar se as palavras estavam separadas.
    const espacoAntes = textoAntes.endsWith(' ') && ladoAntes.length ? ' ' : ''
    const espacoDepois = textoDepois.startsWith(' ') && ladoDepois.length ? ' ' : ''
    const inicio = (ladoAntes.length > palavras ? '…' + ladoAntes.slice(-palavras).join(' ') : ladoAntes.join(' ')) + espacoAntes
    const fim = espacoDepois + (ladoDepois.length > palavras ? ladoDepois.slice(0, palavras).join(' ') + '…' : ladoDepois.join(' '))
    const meio = limpo(trecho).trim()
    const curto = meio.length > 160 ? meio.slice(0, 100) + ' … ' + meio.slice(-40) : meio
    return { antes: inicio, riscado: curto, depois: fim }
  }

  // D2: "automatica" = só na CCL (mesma unidade das peças do Compras IFTO), "sempre" ou "desligada".
  function funcaoLigada (opcao, unidade) {
    const regrasSei = typeof module !== 'undefined' && module.exports ? require('./sei.js') : raiz.ExtensaoIFTO.sei
    return regrasSei.ligadaNaUnidade(opcao, unidade, regrasSei.UNIDADE_CCL)
  }

  const api = { funcaoLigada, OBJETO, normalizar, ehJustificativa, ehLinkComentarioWord, textoDoLinkSai, lerCor, tipoDaCor, espacoAoJuntar, ficouSemTexto, trechoComVolta }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { formatacaoAgu: api })
})(globalThis)
