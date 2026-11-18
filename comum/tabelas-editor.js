// v0.24.0 (spec tabelas-editor): margens das tabelas no editor do SEI 5. A janela "Propriedades da tabela"
// do SEI 5 não tem campo de margem; a extensão põe quatro campos em pixels (v0.25.1) e ainda entende o formato
// antigo colado num deles ("margin:10px auto 10px 28px"). Regras puras: rodam no navegador e no Node (testes).
(function (raiz) {
  const LADOS = ['acima', 'direita', 'abaixo', 'esquerda']
  const LONGAS = { 'margin-top': 'acima', 'margin-right': 'direita', 'margin-bottom': 'abaixo', 'margin-left': 'esquerda' }
  const VALOR = /^(auto|0|-?\d+(\.\d+)?(px|cm|mm|pt|em|%))$/

  // Mesmo recuo dos estilos de texto do SEI do IFTO (margin-left .75cm ≈ 28px), 10px acima e abaixo.
  // v0.25.1: direita 0 (pedido do usuário); com a tabela alinhada à esquerda dá no mesmo que "auto".
  const ALINHADA_AO_TEXTO = Object.freeze({ acima: '10px', direita: '0', abaixo: '10px', esquerda: '28px' })

  function normalizar (valor) {
    const limpo = String(valor || '').trim().toLowerCase().replace(/,/g, '.')
    if (!VALOR.test(limpo)) return null
    return /^-?0+(\.0+)?[a-z%]*$/.test(limpo) ? '0' : limpo
  }

  // Lê o texto colado. Aceita "margin:10px auto 10px 28px", "margin-left:28px; margin-top:10px", só os
  // valores ("10px auto 10px 28px") e o estilo antigo inteiro (largura e o resto são ignorados).
  // Devolve { acima, direita, abaixo, esquerda } só com os lados informados, ou null se não entendeu.
  function lerMargens (texto) {
    const bruto = String(texto || '').trim().replace(/^style\s*=\s*["']?|["']$/gi, '')
    if (!bruto) return null
    const declaracoes = bruto.includes(':') ? bruto.split(';') : ['margin:' + bruto]
    const margens = {}
    let achou = false
    for (const declaracao of declaracoes) {
      const [nome, ...resto] = declaracao.split(':')
      const propriedade = (nome || '').trim().toLowerCase()
      const valor = resto.join(':').replace(/!important/i, '').trim()
      if (propriedade === 'margin') {
        const partes = valor.split(/\s+/).filter(Boolean)
        if (partes.length < 1 || partes.length > 4) return null
        const valores = partes.map(normalizar)
        if (valores.includes(null)) return null
        const [a, d = a, b = a, e = d] = valores
        Object.assign(margens, { acima: a, direita: d, abaixo: b, esquerda: e })
        achou = true
      } else if (LONGAS[propriedade]) {
        const normal = normalizar(valor)
        if (normal === null) return null
        margens[LONGAS[propriedade]] = normal
        achou = true
      }
    }
    return achou ? margens : null
  }

  // v0.25.1: campo de um lado da margem, em pixels. "28", "28px" ou "10,5" viram "28px"/"10.5px"; vazio é 0.
  // Devolve null se não for número.
  function lerPixels (texto) {
    const limpo = String(texto || '').trim().toLowerCase().replace(/,/g, '.').replace(/\s*px$/, '')
    if (!limpo) return '0'
    if (!/^-?\d+(\.\d+)?$/.test(limpo)) return null
    return Number(limpo) === 0 ? '0' : Number(limpo) + 'px'
  }

  // Mostra no campo só o número de pixels ("28px" → "28"; "0.75cm" fica como está).
  function mostrarPixels (valor) {
    const texto = String(valor || '0').trim()
    return /^-?\d+(\.\d+)?(px)?$/.test(texto) ? String(Math.round(parseFloat(texto) * 10) / 10) : texto
  }

  const api = { lerMargens, lerPixels, mostrarPixels, ALINHADA_AO_TEXTO, LADOS }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { tabelasEditor: api })
})(globalThis)
