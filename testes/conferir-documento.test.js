const { test } = require('node:test')
const assert = require('node:assert/strict')
const c = require('../comum/conferir-documento.js')

test('v0.26.0: sigla limpa e unidade do Campus Palmas', () => {
  assert.equal(c.siglaDaUnidade(' cgoc / pal/rei/ifto '), 'CGOC/PAL/REI/IFTO')
  assert.equal(c.ehUnidadePalmas('CGOC/PAL/REI/IFTO'), true)
  assert.equal(c.ehUnidadePalmas('PAL/REI/IFTO'), true)
  assert.equal(c.ehUnidadePalmas('DIAP/REI/IFTO'), false)
  assert.equal(c.ehUnidadePalmas('ARA/REI/IFTO'), false)
})

test('v0.26.0: unidade guardada sem linhas vazias, sem siglas repetidas', () => {
  assert.deepEqual(c.limparUnidade({ sigla: 'cgoc/pal/rei/ifto', telefone: ' 63 3236-4035 ', email: 'CGOC.Palmas@ifto.edu.br', linhas: 'Diretoria\n\n  Coordenação  X \n' }),
    { sigla: 'CGOC/PAL/REI/IFTO', telefone: '63 3236-4035', email: 'cgoc.palmas@ifto.edu.br', linhas: ['Diretoria', 'Coordenação X'] })
  const lista = c.limparUnidades([{ sigla: 'A/PAL/REI/IFTO', telefone: '1' }, { sigla: '' }, { sigla: 'a/pal/rei/ifto', telefone: '2' }])
  assert.equal(lista.length, 1)
  assert.equal(lista[0].telefone, '2')
  assert.equal(c.acharUnidade(lista, 'A/PAL/REI/IFTO').telefone, '2')
  assert.equal(c.acharUnidade(lista, 'B/PAL/REI/IFTO'), null)
  assert.deepEqual(c.limparUnidades(undefined), [])
})
