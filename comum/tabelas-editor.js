// v0.24.0 (spec tabelas-editor): margens das tabelas no editor do SEI 5. A janela "Propriedades da tabela"
// do SEI 5 não tem campo de margem; a extensão aceita o formato antigo ("margin:10px auto 10px 28px") e
// ignora a largura (o SEI já tem o campo Largura). Regras puras: rodam no navegador e no Node (testes).
(function (raiz) {
  const LADOS = ['acima', 'direita', 'abaixo', 'esquerda']
  const LONGAS = { 'margin-top': 'acima', 'margin-right': 'direita', 'margin-bottom': 'abaixo', 'margin-left': 'esquerda' }
  const VALOR = /^(auto|0|-?\d+(\.\d+)?(px|cm|mm|pt|em|%))$/

  // Mesmo recuo dos estilos de texto do SEI do IFTO (margin-left .75cm ≈ 28px), 10px acima e abaixo.
  const ALINHADA_AO_TEXTO = Object.freeze({ acima: '10px', direita: 'auto', abaixo: '10px', esquerda: '28px' })

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

  // Escreve no formato antigo, para mostrar as margens que a tabela já tem.
  function escreverMargens (margens) {
    if (!margens || !LADOS.some(lado => margens[lado])) return ''
    return 'margin:' + LADOS.map(lado => margens[lado] || (lado === 'direita' ? 'auto' : '0')).join(' ')
  }

  const api = { lerMargens, escreverMargens, ALINHADA_AO_TEXTO, LADOS }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { tabelasEditor: api })
})(globalThis)
