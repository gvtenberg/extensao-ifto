const { test } = require('node:test')
const assert = require('node:assert/strict')
const { TIPOS, funcaoLigada } = require('../comum/documentos-pagamento.js')

// v0.7.0: botão dos documentos do pagamento.
test('tipos na ordem: Sicaf, Consulta, Anexo', () => {
  assert.deepEqual([...TIPOS], ['Sicaf', 'Consulta', 'Anexo'])
})

test('automática: só na CGOC', () => {
  assert.equal(funcaoLigada('automatica', 'CGOC/GAC/DAP/PAL/REI/IFTO'), true)
  assert.equal(funcaoLigada('automatica', ' cgoc/gac/dap/pal/rei/ifto '), true)
  assert.equal(funcaoLigada('automatica', 'PAL/REI/IFTO'), false)
  assert.equal(funcaoLigada(undefined, ''), false)
})

test('sempre ligada e desligada valem em qualquer unidade', () => {
  assert.equal(funcaoLigada('sempre', 'PAL/REI/IFTO'), true)
  assert.equal(funcaoLigada('desligada', 'CGOC/GAC/DAP/PAL/REI/IFTO'), false)
})
