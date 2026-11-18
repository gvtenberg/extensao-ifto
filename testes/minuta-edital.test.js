const { test } = require('node:test')
const assert = require('node:assert/strict')
const { temMarcaMinuta, tirarMarcaMinuta, ehEdital, funcaoLigada } = require('../comum/minuta-edital.js')
const { numeroDaUnidade } = require('../comum/sei.js')

// Trechos do Edital 3390039 (18/11/2026): v1 veio da minuta; no v2 a etiqueta saiu, mas o estilo ficou.
const ESTILO_SEIPRO = '<style data-style="seipro-watermark" type="text/css">body:after, .ck-editor__editable_inline:after { content: "MINUTA"; font-size: 9em; } .minutaAncora { color:#d45656; } </style>'
const ANCORA = '<span class="minutaAncora" contenteditable="false" data-type="auto">&nbsp;* MINUTA DE DOCUMENTO&nbsp;</span>'
const V1 = `<p data-c="4198">${ESTILO_SEIPRO}${ANCORA} &nbsp;</p><p class="IFTO_Cabeçalho_"><img src="data:image/png;base64,AAA"></p>` +
  '<p class="Texto_Centralizado_Maiusculas_Negrito">minuta de EDITAL</p>' +
  `<p class="IFTO_Tabela_Texto_Justificado" data-c="4208">${ESTILO_SEIPRO}${ANCORA} &nbsp;</p><p class="Item_nivel_1_Edital_titulo"><strong>DAS DISPOSIÇÕES PRELIMINARES</strong></p>`
const V2 = '<p class="Texto_Justificado">torna público o Edital.</p><p class="IFTO_Tabela_Texto_Justificado" data-c="4208"><style> body:after, .ck-editor__editable_inline:after { content: "MINUTA"; font-size: 9em; } </style><span contenteditable="false">&nbsp;</span> &nbsp;</p><p class="Item_nivel_1_Edital_titulo"><strong>DAS DISPOSIÇÕES PRELIMINARES</strong></p>'

test('acha a marca MINUTA com e sem o data-style do SEI Pro e com só a etiqueta', () => {
  assert.equal(temMarcaMinuta(V1), true)
  assert.equal(temMarcaMinuta(V2), true)
  assert.equal(temMarcaMinuta(`<p>${ANCORA}</p>`), true)
  assert.equal(temMarcaMinuta('<p>Texto do edital</p><style>p { color: red }</style>'), false)
})

test('tira a marca do v1, apaga os parágrafos que ficaram vazios e mantém o resto', () => {
  const { html, removidas } = tirarMarcaMinuta(V1)
  assert.equal(removidas, 4)
  assert.equal(temMarcaMinuta(html), false)
  assert.doesNotMatch(html, /data-c="4198"|data-c="4208"/)
  assert.match(html, /<img src="data:image\/png;base64,AAA">/)
  assert.match(html, /DAS DISPOSIÇÕES PRELIMINARES/)
})

test('tira o estilo que sobrou no v2 (sem etiqueta)', () => {
  const { html, removidas } = tirarMarcaMinuta(V2)
  assert.equal(removidas, 1)
  assert.equal(temMarcaMinuta(html), false)
  assert.equal(html, '<p class="Texto_Justificado">torna público o Edital.</p><p class="Item_nivel_1_Edital_titulo"><strong>DAS DISPOSIÇÕES PRELIMINARES</strong></p>')
})

test('parágrafo com texto e marca: tira só a marca e o texto fica', () => {
  const { html } = tirarMarcaMinuta(`<p class="x">${ANCORA}Texto que fica</p>`)
  assert.equal(html, '<p class="x">Texto que fica</p>')
})

test('outros estilos e a palavra minuta no texto não são tirados; o texto com minuta vira aviso', () => {
  const { html, removidas, trechos } = tirarMarcaMinuta(V1 + '<style>p { color: red }</style>')
  assert.match(html, /<style>p \{ color: red \}<\/style>/)
  assert.match(html, /minuta de EDITAL/)
  assert.equal(removidas, 4)
  assert.equal(trechos.length, 1)
  assert.match(trechos[0], /minuta de EDITAL/)
})

test('sem marca, o texto volta igual', () => {
  const texto = '<p>Edital sem marca</p>'
  assert.deepEqual(tirarMarcaMinuta(texto), { html: texto, removidas: 0, trechos: [] })
})

test('só documentos do tipo Edital (Minuta de Edital fica de fora)', () => {
  assert.equal(ehEdital('SEI/IFTO - 3390039 - Edital Gabinete'), true)
  assert.equal(ehEdital('SEI/IFTO - 3390039 - Edital'), true)
  assert.equal(ehEdital('SEI/IFTO - 3386264 - Minuta de Edital'), false)
  assert.equal(ehEdital('SEI/IFTO - 3386264 - Ofício 12'), false)
  assert.equal(ehEdital(''), false)
})

test('número da unidade vem do endereço do editor ou do link da unidade', () => {
  assert.equal(numeroDaUnidade('controlador.php?acao=editor_montar&id_documento=1&infra_unidade_atual=110000224&infra_hash=x'), '110000224')
  assert.equal(numeroDaUnidade("acao=infra_trocar_unidade&amp;infra_unidade_atual=110000225&amp;x"), '110000225')
  assert.equal(numeroDaUnidade('sem unidade'), '')
})

test('automática só na Direção-geral (PAL/REI/IFTO)', () => {
  assert.equal(funcaoLigada('automatica', 'PAL/REI/IFTO'), true)
  assert.equal(funcaoLigada('automatica', 'CGOC/GAC/DAP/PAL/REI/IFTO'), false)
  assert.equal(funcaoLigada('sempre', 'CGOC/GAC/DAP/PAL/REI/IFTO'), true)
  assert.equal(funcaoLigada('desligada', 'PAL/REI/IFTO'), false)
})
