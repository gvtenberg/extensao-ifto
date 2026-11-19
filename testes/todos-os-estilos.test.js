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
