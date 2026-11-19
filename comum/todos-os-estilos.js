// v0.29.0 (spec todos-os-estilos): regras de "todos os estilos em todos os documentos" no editor do SEI 5, sem
// depender da página (testáveis no computador). Cada tipo de documento do SEI traz só os seus estilos (o Edital
// tem 41, o Despacho bem menos); a extensão junta os que faltam no texto principal, marcados com "★".
(function (raiz) {
  const MARCA = 'extensao-ifto: estilos extras'
  const ESTRELA = '★ '
  const NOTA = 'Estilos com ★ vêm da extensão; quem editar sem ela pode perder essa formatação.'
  // R3: partes do texto principal = as que aceitam um destes estilos de texto do próprio tipo.
  const ESTILOS_DE_TEXTO = ['Texto_Justificado', 'IFTO_padrao_Alin_Justificado']

  // Nome do estilo de uma regra de CSS do SEI (".Item_Nivel2{...}" ou ".Item_Nivel2:before{...}").
  function nomeDaRegra (regra) {
    const achado = /^\s*\.([^\s:{,.]+)/.exec(String(regra || ''))
    return achado ? achado[1] : ''
  }

  // Estilos de um editor (configuração "infra.estilo": itens e css) como { nome: [regras de CSS] }.
  // Usado para aprender os estilos de cada editor aberto (R2).
  function estilosDoEditor (config) {
    const css = {}
    for (const regra of (config && config.css) || []) {
      const nome = nomeDaRegra(regra)
      if (nome) (css[nome] = css[nome] || []).push(String(regra).replace(/\r/g, ' '))
    }
    const resultado = {}
    for (const item of (config && config.itens) || []) {
      const regras = item && item.nome && css[item.classeCss || item.nome]
      if (regras) resultado[item.nome] = regras
    }
    return resultado
  }

  // R2: lista fixa (estilos do Edital) e, por cima, os aprendidos (mesmo nome: vale o aprendido).
  function listaCompleta (aprendidos) {
    const resultado = {}
    for (const [nome, regras] of FIXOS) resultado[nome] = regras
    for (const [nome, regras] of Object.entries(aprendidos || {})) {
      if (Array.isArray(regras) && regras.length && regras.every(regra => nomeDaRegra(regra) === nome)) resultado[nome] = regras.map(String)
    }
    return resultado
  }

  // R3: partes onde os estilos extras entram: as que aceitam os estilos de texto do tipo; sem nenhuma, a seção
  // principal do editor (quando a página diz qual é).
  function raizesDoTexto (itensDoTipo, principal) {
    const raizes = new Set()
    for (const item of itensDoTipo || []) {
      if (ESTILOS_DE_TEXTO.includes(item && item.nome)) for (const r of item.permitidoEm || []) raizes.add(r)
    }
    if (!raizes.size && principal) raizes.add(principal)
    return [...raizes]
  }

  // R4 e D8: os estilos que o tipo não tem, em ordem alfabética; nome que o tipo já tem fica de fora.
  function estilosExtras (nomesDoTipo, todos, raizes) {
    const doTipo = new Set(nomesDoTipo || [])
    return Object.keys(todos || {})
      .filter(nome => !doTipo.has(nome))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map(nome => ({ nome, classeCss: nome, permitidoEm: [...(raizes || [])], extensaoIfto: true }))
  }

  // R6: bloco de estilo escondido com o CSS só dos estilos extras em uso (sem nenhum: vazio).
  function blocoDeEstilo (nomesEmUso, todos) {
    const nomes = [...new Set(nomesEmUso || [])].filter(nome => todos && todos[nome]).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    if (!nomes.length) return ''
    return '<style>/* ' + MARCA + ': ' + nomes.join(',') + ' */' + nomes.map(nome => todos[nome].join('')).join('') + '</style>'
  }
  // Nomes guardados no bloco que já está no texto (null: não tem bloco).
  function nomesNoBloco (html) {
    const achado = new RegExp('/\\* ' + MARCA + ': ([^*]*) \\*/').exec(String(html || ''))
    return achado ? achado[1].split(',').filter(Boolean) : null
  }
  const temBloco = html => String(html || '').includes(MARCA)
  // Tira o bloco do texto (o editor tira os atributos do <style>, o comentário com a marca fica).
  const tirarBloco = html => String(html || '').replace(/<style\b[^>]*>(?:(?!<\/style>)[\s\S])*?extensao-ifto: estilos extras[\s\S]*?<\/style>/gi, '')

  // Nomes dos estilos extras usados nos parágrafos (o que o editor guarda em cada um), sem repetir.
  function extrasEmUso (estilosDosParagrafos, extras) {
    const nomes = new Set((extras || []).map(extra => extra.nome || extra))
    return [...new Set((estilosDosParagrafos || []).filter(nome => nomes.has(nome)))]
  }
  const mesmosNomes = (a, b) => a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',')

  // Lista fixa: os 41 estilos do Edital do SEI do IFTO (documento 3384558, 19/11/2026), nome e CSS.
  const FIXOS = [
    ["Citacao", [".Citacao{margin:4pt 0 4pt .75cm;; font-family:Calibri; text-align:justify; font-size:1em; max-width:604px; word-wrap:normal;}"]],
    ["IFTO_Alin_direita_sem_espaço", [".IFTO_Alin_direita_sem_espaço{margin:0 0 0 .75cm;; max-width:604px; line-height:100%; text-align:right; font-size:1em; font-family:Calibri;}"]],
    ["IFTO_Assinatura", [".IFTO_Assinatura{margin-right:0; margin-left:.75cm; text-align:center; font-size:1em; font-family:Calibri; line-height:10%; max-width:604px;}"]],
    ["IFTO_Cabeçalho_", [".IFTO_Cabeçalho_{margin-right:0; margin-left:.75cm; text-align:center; text-transform:uppercase; font-size:0.813em; font-family:Calibri; line-height:10%; max-width:604px;}"]],
    ["IFTO_Cabeçalho_Novo", [".IFTO_Cabeçalho_Novo{margin-right:0; margin-left:.75cm; text-align:center; font-size:0.9em; font-family:Calibri; line-height:10%; max-width:604px;}"]],
    ["IFTO_Centralizado", [".IFTO_Centralizado{margin:0 0 0 .75cm;; text-align:center; font-size:1em; font-family:Calibri; max-width:604px;}"]],
    ["IFTO_Centralizado_espaço_topo", [".IFTO_Centralizado_espaço_topo{margin:0 0 0 .75cm;; text-align:center; font-size:1em; font-family:Calibri; max-width:604px; padding-top:.500em;}"]],
    ["IFTO_Centralizado_Negrito_Maiusculo", [".IFTO_Centralizado_Negrito_Maiusculo{margin:0 0 0 .75cm;; max-width:604px; line-height:100%; text-align:center; font-size:1em; font-weight:bold; text-transform:uppercase; font-family:Calibri;}"]],
    ["IFTO_Centralizado_rodape", [".IFTO_Centralizado_rodape{margin:0 0 0 .75cm;; text-align:center; font-size:0.9em; font-family:Calibri; max-width:604px;}"]],
    ["IFTO_Tabela_Texto_8", [".IFTO_Tabela_Texto_8{text-align:left; word-wrap:normal; margin:0 3pt 0 3pt; line-height:100%; font-size:1em; font-family:Calibri;}"]],
    ["IFTO_Tabela_Texto_Alinhado_Direita", [".IFTO_Tabela_Texto_Alinhado_Direita{text-align:right; word-wrap:normal; margin:0 3pt 0 3pt; line-height:100%; font-size:1em; font-family:Calibri;}"]],
    ["IFTO_Tabela_Texto_Alinhado_Esquerda", [".IFTO_Tabela_Texto_Alinhado_Esquerda{line-height:100%; font-size:1em; font-family:Calibri; text-align:left; word-wrap:normal; margin:0 3pt 0 3pt;}"]],
    ["IFTO_Tabela_Texto_Centralizado", [".IFTO_Tabela_Texto_Centralizado{line-height:100%; font-size:1em; font-family:Calibri; text-align:center; word-wrap:normal; margin:0 3pt 0;}"]],
    ["IFTO_Tabela_Texto_Justificado", [".IFTO_Tabela_Texto_Justificado{text-align:justify; word-wrap:normal; margin:0 3pt 0 3pt; line-height:100%; font-size:1em; font-family:Calibri;}"]],
    ["Item_Alinea_Letra", [".Item_Alinea_Letra{margin:6pt 6pt 6pt .75cm;; font-family:Calibri; text-align:justify; font-size:1em; max-width:604px; word-wrap:normal;text-indent:0mm;counter-increment:letra_minuscula;}", ".Item_Alinea_Letra:before{content:counter(letra_minuscula, lower-latin) \") \";display:inline-block;width:5mm;font-weight:normal;}"]],
    ["Item_Inciso_Romano", [".Item_Inciso_Romano{font-family:Calibri; text-align:justify; font-size:1em; max-width:604px; word-wrap:normal;text-indent:0mm;margin:6pt 6pt 6pt .75cm;;counter-increment:romano_maiusculo;counter-reset:letra_minuscula;}", ".Item_Inciso_Romano:before{content:counter(romano_maiusculo, upper-roman) \" - \";display:inline-block;width:15mm;font-weight:normal;}"]],
    ["Item_Nivel1", [".Item_Nivel1{text-transform:uppercase;font-weight:bold;background-color:#e6e6e6; margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; word-wrap:normal;text-indent:0;counter-increment:item-n1;counter-reset:item-n2 item-n3 item-n4 romano_maiusculo letra_minuscula;}", ".Item_Nivel1:before{content:counter(item-n1) \".\";display:inline-block;width:25mm;font-weight:normal;}"]],
    ["Item_Nivel2", [".Item_Nivel2{margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:0mm;word-wrap:normal;counter-increment:item-n2;counter-reset:item-n3 item-n4 romano_maiusculo letra_minuscula;}", ".Item_Nivel2:before{content:counter(item-n1) \".\" counter(item-n2) \".\";display:inline-block;width:25mm;font-weight:normal;}"]],
    ["Item_Nivel3", [".Item_Nivel3{margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:0mm;word-wrap:normal;counter-increment:item-n3;counter-reset:item-n4 romano_maiusculo letra_minuscula;}", ".Item_Nivel3:before{content:counter(item-n1) \".\" counter(item-n2) \".\" counter(item-n3) \".\";display:inline-block;width:25mm;font-weight:normal;}"]],
    ["Item_Nivel4", [".Item_Nivel4{margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:0mm;word-wrap:normal;counter-increment:item-n4;counter-reset:item-n5 romano_maiusculo letra_minuscula;}", ".Item_Nivel4:before{content:counter(item-n1) \".\" counter(item-n2) \".\" counter(item-n3) \".\"  counter(item-n4) \".\";display:inline-block;width:25mm;font-weight:normal;}"]],
    ["Item_nivel_1_Edital_titulo", [".Item_nivel_1_Edital_titulo{text-transform:uppercase;font-weight:bold;background-color:#e6e6e6; margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; word-wrap:normal;text-indent:0;counter-increment:item-n1;counter-reset:item-n2 item-n3 item-n4 item-n5 romano_maiusculo letra_minuscula; padding-top:0.500em;}", ".Item_nivel_1_Edital_titulo:before{content:counter(item-n1) \".\";display:inline-block;width:10mm;font-weight:normal;}"]],
    ["Item_nivel_2_Edital", [".Item_nivel_2_Edital{margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:0mm;word-wrap:normal;counter-increment:item-n2;counter-reset:item-n3 item-n4 item-n5 romano_maiusculo letra_minuscula;}", ".Item_nivel_2_Edital:before{content:counter(item-n1) \".\" counter(item-n2) \".\";display:inline-block;width:10mm;font-weight:normal;}"]],
    ["Item_nivel_3_Edital", [".Item_nivel_3_Edital{margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:0mm;word-wrap:normal;counter-increment:item-n3;counter-reset:item-n4 item-n5 romano_maiusculo letra_minuscula;}", ".Item_nivel_3_Edital:before{content:counter(item-n1) \".\" counter(item-n2) \".\" counter(item-n3) \".\";display:inline-block;width:15mm;font-weight:normal;}"]],
    ["Item_nivel_4_Edital", [".Item_nivel_4_Edital{margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:0mm;word-wrap:normal;counter-increment:item-n4;counter-reset:item-n5 romano_maiusculo letra_minuscula;}", ".Item_nivel_4_Edital:before{content:counter(item-n1) \".\" counter(item-n2) \".\" counter(item-n3) \".\"  counter(item-n4) \".\";display:inline-block;width:18mm;font-weight:normal;}"]],
    ["Paragrafo_Numerado_Nivel1", [".Paragrafo_Numerado_Nivel1{margin:0 0 0 .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; word-wrap:normal;text-indent:0mm;counter-increment:paragrafo-n1;counter-reset:paragrafo-n2 paragrafo-n3 paragrafo-n4 romano_maiusculo letra_minuscula;}", ".Paragrafo_Numerado_Nivel1:before{content:counter(paragrafo-n1) \".\";display:inline-block;width:25mm;font-weight:normal;}"]],
    ["Paragrafo_Numerado_Nivel2", [".Paragrafo_Numerado_Nivel2{margin:0 0 0 .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:0mm;word-wrap:normal;counter-increment:paragrafo-n2;counter-reset:paragrafo-n3 paragrafo-n4 romano_maiusculo letra_minuscula;}", ".Paragrafo_Numerado_Nivel2:before{content:counter(paragrafo-n1) \".\" counter(paragrafo-n2) \".\";display:inline-block;width:25mm;font-weight:normal;}"]],
    ["Paragrafo_Numerado_Nivel3", [".Paragrafo_Numerado_Nivel3{margin:0 0 0 .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:0mm;word-wrap:normal;counter-increment:paragrafo-n3;counter-reset:paragrafo-n4 romano_maiusculo letra_minuscula;}", ".Paragrafo_Numerado_Nivel3:before{content:counter(paragrafo-n1) \".\" counter(paragrafo-n2) \".\" counter(paragrafo-n3) \".\";display:inline-block;width:25mm;font-weight:normal;}"]],
    ["Paragrafo_Numerado_Nivel4", [".Paragrafo_Numerado_Nivel4{margin:0 0 0 .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:0mm;word-wrap:normal;counter-increment:paragrafo-n4;counter-reset:romano_maiusculo letra_minuscula;}", ".Paragrafo_Numerado_Nivel4:before{content:counter(paragrafo-n1) \".\" counter(paragrafo-n2) \".\" counter(paragrafo-n3) \".\" counter(paragrafo-n4) \".\";display:inline-block;width:25mm;font-weight:normal;}"]],
    ["Texto_Alinhado_Direita", [".Texto_Alinhado_Direita{margin:0 0 0 .75cm;; max-width:604px; font-size:1em; font-family:Calibri; text-align:right;word-wrap:normal;}"]],
    ["Texto_Alinhado_Esquerda", [".Texto_Alinhado_Esquerda{margin:0 0 0 .75cm;; max-width:604px; font-size:1em; font-family:Calibri; text-align:left;word-wrap:normal;}"]],
    ["Texto_Alinhado_Esquerda_Espacamento_Simples", [".Texto_Alinhado_Esquerda_Espacamento_Simples{margin:0 0 0 .75cm;; max-width:604px; font-size:1em; font-family:Calibri; text-align:left;word-wrap:normal;}"]],
    ["Texto_Alinhado_Esquerda_Espacamento_Simples_Maiusc", [".Texto_Alinhado_Esquerda_Espacamento_Simples_Maiusc{margin:0 0 0 .75cm;; max-width:604px; font-size:1em; font-family:Calibri; text-align:left;text-transform:uppercase;word-wrap:normal;}"]],
    ["Texto_Centralizado", [".Texto_Centralizado{margin:6pt 6pt 6pt .75cm;; max-width:604px; font-size:1em; font-family:Calibri; text-align:center;word-wrap:normal;}"]],
    ["Texto_Centralizado_Maiusculas", [".Texto_Centralizado_Maiusculas{margin:0 0 0 .75cm;; max-width:604px; font-size:1em; font-family:Calibri; text-align:center;text-transform:uppercase;word-wrap:normal;}"]],
    ["Texto_Centralizado_Maiusculas_Negrito", [".Texto_Centralizado_Maiusculas_Negrito{margin:0 0 0 .75cm;; max-width:604px; font-size:1em; font-family:Calibri; font-weight:bold;text-align:center;text-transform:uppercase;word-wrap:normal;}"]],
    ["Texto_Fundo_Cinza_Maiusculas_Negrito", [".Texto_Fundo_Cinza_Maiusculas_Negrito{max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-transform:uppercase;font-weight:bold;background-color:#e6e6e6;word-wrap:normal;text-indent:0;margin:6pt 6pt 6pt .75cm;;}"]],
    ["Texto_Fundo_Cinza_Negrito", [".Texto_Fundo_Cinza_Negrito{max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; font-weight:bold;background-color:#e6e6e6;word-wrap:normal;text-indent:0;margin:6pt 6pt 6pt .75cm;;}"]],
    ["Texto_Justificado", [".Texto_Justificado{margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; word-wrap:normal;text-indent:0;counter-reset:romano_maiusculo;}"]],
    ["Texto_Justificado_Maiusculas", [".Texto_Justificado_Maiusculas{max-width:604px; text-align:justify; font-size:1em; font-family:Calibri;margin:6pt 6pt 6pt .75cm;; word-wrap:normal;text-indent:0;text-transform:uppercase;}"]],
    ["Texto_Justificado_Recuo_Primeira_Linha", [".Texto_Justificado_Recuo_Primeira_Linha{margin:6pt 6pt 6pt .75cm;; max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:25mm;word-wrap:normal;}"]],
    ["Texto_Justificado_Recuo_Primeira_Linha_Esp_Simples", [".Texto_Justificado_Recuo_Primeira_Linha_Esp_Simples{max-width:604px; text-align:justify; font-size:1em; font-family:Calibri; text-indent:25mm;word-wrap:normal;margin:0 0 0 .75cm;;}"]]
  ]

  const api = { MARCA, ESTRELA, NOTA, ESTILOS_DE_TEXTO, FIXOS, nomeDaRegra, estilosDoEditor, listaCompleta, raizesDoTexto, estilosExtras, blocoDeEstilo, nomesNoBloco, temBloco, tirarBloco, extrasEmUso, mesmosNomes }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else raiz.ExtensaoIFTO = Object.assign(raiz.ExtensaoIFTO || {}, { todosOsEstilos: api })
})(globalThis)
