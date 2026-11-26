// v0.37.0 (spec numeracao-caixas-ocultas): regras puras (navegador e Node) da numeração quebrada por caixas
// escondidas e dos números digitados à mão. Na Minuta de Ata 3399532 (modelo antigo do SEI) parte do texto fica
// dentro de <div> sem atributos. Pela regra dos contadores do navegador (CSS Lists 3), um parágrafo dentro da
// caixa não herda o contador que o título vizinho reinicia quando já vem um contador de mesmo nome de fora da
// caixa: o título "3" reinicia, mas o item seguinte continua de 2.2 e mostra "3.3". Tirar o texto das caixas
// (todos os parágrafos lado a lado, como no Edital) faz a numeração voltar a funcionar.
(function (raiz) {
  // Estilos numerados do SEI e o nível de cada um (0 = título que zera todos os níveis).
  const NIVEIS = Object.freeze({
    IFTO_Titulo_Centralizado_EspaçoTopo_negrito: 0,
    Item_nivel_1_Edital_titulo: 1, Item_nivel_1_Edital: 1, Item_Nivel1: 1, IFTO_Item_Nvl_1: 1,
    Item_nivel_2_Edital: 2, Item_Nivel2: 2, IFTO_Item_Nvl_2: 2,
    Item_nivel_3_Edital: 3, Item_Nivel3: 3, IFTO_Item_Nvl_3: 3,
    Item_nivel_4_Edital: 4, Item_Nivel4: 4, IFTO_Item_Nvl_4: 4
  })
  // Estilos que usam contadores (numeração automática): não são "parágrafo normal" para os números digitados.
  const NUMERADO = /^(Item_|IFTO_Item_)/

  const nivelDoEstilo = estilo => Object.prototype.hasOwnProperty.call(NIVEIS, estilo) ? NIVEIS[estilo] : null
  const ehNumerado = estilo => NUMERADO.test(String(estilo || '')) || nivelDoEstilo(estilo) !== null

  // Caixa escondida que atrapalha: <div> sem nenhum atributo (a do SEI com "counter-reset" e a caixa
  // "Processo/Interessado/Assunto" têm estilo) com pelo menos um parágrafo numerado dentro.
  function caixaQueAtrapalha ({ atributos = [], estilosDentro = [] } = {}) {
    return atributos.length === 0 && estilosDentro.some(ehNumerado)
  }

  // Número digitado no começo do texto: "3.1. Texto", "4.2.1 Texto", " 4.11.  Texto". Só 2 a 4 partes (um
  // número só, "3.", é título). Devolve { numero, partes, nivel, tamanho } (tamanho = letras a tirar do começo,
  // com os espaços depois do número) ou null.
  function lerNumeroDigitado (texto) {
    const achado = /^[\s ]*(\d{1,3}(?:\.\d{1,3}){1,3})\.?[\s ]+(?=\S)/.exec(String(texto || ''))
    if (!achado) return null
    const partes = achado[1].split('.').map(Number)
    return { numero: achado[1], partes, nivel: partes.length, tamanho: achado[0].length }
  }

  // Estilo novo do parágrafo convertido: família "Item_Nivel" (escolha do usuário, 26/11/2026) ou a do Edital
  // quando o SEI não deixa a primeira naquela parte do texto (D4).
  function estiloPara (nivel, familia = 'nivel') {
    if (nivel < 2 || nivel > 4) return ''
    return familia === 'edital' ? 'Item_nivel_' + nivel + '_Edital' : 'Item_Nivel' + nivel
  }

  // Números que a numeração automática vai mostrar, na ordem do texto. Recebe a lista de níveis (0 a 4, ou
  // null para parágrafo sem número) e devolve o número de cada um ("3.1") ou '' (sem número).
  function numerar (niveis) {
    const contadores = [0, 0, 0, 0, 0]
    return (niveis || []).map(nivel => {
      if (nivel === null || nivel === undefined) return ''
      if (nivel === 0) { contadores.fill(0); return '' }
      contadores[nivel] += 1
      for (let i = nivel + 1; i < contadores.length; i++) contadores[i] = 0
      return contadores.slice(1, nivel + 1).join('.')
    })
  }

  const api = { NIVEIS, nivelDoEstilo, ehNumerado, caixaQueAtrapalha, lerNumeroDigitado, estiloPara, numerar }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { numeracaoDigitada: api })
})(globalThis)
