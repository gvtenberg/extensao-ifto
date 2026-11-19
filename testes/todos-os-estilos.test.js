const { test } = require('node:test')
const assert = require('node:assert/strict')
const r = require('../comum/todos-os-estilos.js')

// v0.29.0 (spec todos-os-estilos)
test('lista fixa: 41 estilos do Edital, cada um com o próprio CSS', () => {
  assert.equal(r.FIXOS.length, 41)
  for (const [nome, regras] of r.FIXOS) for (const regra of regras) assert.equal(r.nomeDaRegra(regra), nome)
  assert.ok(r.listaCompleta().Item_Nivel2.some(regra => regra.includes(':before')))
})

test('estilosDoEditor junta itens e CSS pelo nome; aprendido troca o fixo de mesmo nome', () => {
  const config = { itens: [{ nome: 'Novo', classeCss: 'Novo', permitidoEm: ['a'] }, { nome: 'SemCss', classeCss: 'SemCss' }], css: ['.Novo{color:red;}', '.Novo:before{content:"1"}'] }
  const proprios = r.estilosDoEditor(config)
  assert.deepEqual(proprios, { Novo: ['.Novo{color:red;}', '.Novo:before{content:"1"}'] })
  const todos = r.listaCompleta({ ...proprios, Citacao: ['.Citacao{color:blue}'], Errado: ['.Outro{x:y}'] })
  assert.deepEqual(todos.Citacao, ['.Citacao{color:blue}'])
  assert.ok(todos.Novo)
  assert.equal(todos.Errado, undefined)
})

test('raizesDoTexto: partes que aceitam o texto justificado; sem elas, a seção principal', () => {
  const itens = [{ nome: 'Texto_Justificado', permitidoEm: ['t1', 't3'] }, { nome: 'IFTO_Assinatura', permitidoEm: ['t9'] }]
  assert.deepEqual(r.raizesDoTexto(itens, 'p'), ['t1', 't3'])
  assert.deepEqual(r.raizesDoTexto([{ nome: 'IFTO_Assinatura', permitidoEm: ['t9'] }], 'p'), ['p'])
})

test('estilosExtras: sem nome repetido, ordem alfabética, só nas partes do texto', () => {
  const extras = r.estilosExtras(['Citacao'], { Citacao: ['.Citacao{}'], Zeta: ['.Zeta{}'], Alfa: ['.Alfa{}'] }, ['t1'])
  assert.deepEqual(extras.map(e => e.nome), ['Alfa', 'Zeta'])
  assert.deepEqual(extras[0].permitidoEm, ['t1'])
})

test('blocoDeEstilo: só o CSS dos extras em uso, com a marca; vazio sem nenhum', () => {
  const todos = { B: ['.B{color:red}'], A: ['.A{x:1}', '.A:before{content:"1"}'] }
  const bloco = r.blocoDeEstilo(['B', 'A', 'B', 'X'], todos)
  assert.equal(bloco, '<style>/* extensao-ifto: estilos extras: A,B */.A{x:1}.A:before{content:"1"}.B{color:red}</style>')
  assert.deepEqual(r.nomesNoBloco('<p>' + bloco + 'texto</p>'), ['A', 'B'])
  assert.equal(r.nomesNoBloco('<p>nada</p>'), null)
  assert.equal(r.blocoDeEstilo([], todos), '')
  assert.ok(r.temBloco(bloco))
})

test('tirarBloco tira só o bloco da extensão; extrasEmUso só os extras, sem repetir', () => {
  const bloco = r.blocoDeEstilo(['A'], { A: ['.A{x:1}'] })
  assert.equal(r.tirarBloco('<p>' + bloco + '<style>.outro{}</style>texto</p>'), '<p><style>.outro{}</style>texto</p>')
  assert.deepEqual(r.extrasEmUso(['A', 'Texto_Justificado', 'A', undefined, 'B'], [{ nome: 'A' }, { nome: 'B' }]), ['A', 'B'])
  assert.ok(r.mesmosNomes(['B', 'A'], ['A', 'B']))
  assert.ok(!r.mesmosNomes(['A'], ['A', 'B']))
})

test('fundoNaLista devolve o cinza só dos estilos com fundo (v0.29.3)', () => {
  const css = r.fundoNaLista(r.listaCompleta({}))
  assert.match(css, /\.ck-button\.Item_nivel_1_Edital_titulo:not\(:hover\):not\(\.ck-on\)\{background:#e6e6e6\}/)
  assert.match(css, /Texto_Fundo_Cinza_Negrito/)
  assert.doesNotMatch(css, /Item_Nivel2/)
})

test('paragrafosComEstilo acha no texto original os parágrafos com estilo extra (v0.29.3)', () => {
  const html = '<p class="Texto_Justificado">Oi</p><p class="Item_Nivel2 x">1.1 Prazo de&nbsp;<b>10</b> dias &amp; mais</p><p>sem</p>'
  assert.deepEqual(r.paragrafosComEstilo(html, ['Item_Nivel2']), [{ nome: 'Item_Nivel2', texto: '1.1 Prazo de 10 dias & mais' }])
  assert.deepEqual(r.paragrafosComEstilo('<p>nada</p>', ['Item_Nivel2']), [])
})

test('fundoNaLista também põe o negrito na lista (v0.31.1, T188)', () => {
  const css = r.fundoNaLista(r.listaCompleta({}))
  assert.match(css, /\.ck-button\.IFTO_Centralizado_Negrito_Maiusculo \.ck-button__label\{font-weight:bold\}/)
  assert.doesNotMatch(css, /Item_Nivel2 \.ck-button__label/)
})
