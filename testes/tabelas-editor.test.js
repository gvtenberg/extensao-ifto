const { test } = require('node:test')
const assert = require('node:assert/strict')
const { lerMargens, escreverMargens, ALINHADA_AO_TEXTO } = require('../comum/tabelas-editor.js')

test('margens no formato antigo do SEI (a largura é ignorada)', () => {
  assert.deepEqual(lerMargens('margin:10px auto 10px 28px;widith:604px;max-widith:608px'), { acima: '10px', direita: 'auto', abaixo: '10px', esquerda: '28px' })
  assert.deepEqual(lerMargens('margin: 10px auto 10px 28px; width:604px; max-width:608px;'), { acima: '10px', direita: 'auto', abaixo: '10px', esquerda: '28px' })
  assert.deepEqual(lerMargens('style="margin:10px auto 10px 28px"'), { acima: '10px', direita: 'auto', abaixo: '10px', esquerda: '28px' })
})

test('margens com 1, 2 ou 3 valores, só os valores e lados separados', () => {
  assert.deepEqual(lerMargens('margin:10px'), { acima: '10px', direita: '10px', abaixo: '10px', esquerda: '10px' })
  assert.deepEqual(lerMargens('margin:10px auto'), { acima: '10px', direita: 'auto', abaixo: '10px', esquerda: 'auto' })
  assert.deepEqual(lerMargens('margin:0 auto 5px'), { acima: '0', direita: 'auto', abaixo: '5px', esquerda: 'auto' })
  assert.deepEqual(lerMargens('10px auto 10px 0.75cm'), { acima: '10px', direita: 'auto', abaixo: '10px', esquerda: '0.75cm' })
  assert.deepEqual(lerMargens('margin-left:28px; margin-top:0px'), { esquerda: '28px', acima: '0' })
  assert.deepEqual(lerMargens('margin-left: 0,75cm'), { esquerda: '0.75cm' })
})

test('texto que não é margem', () => {
  assert.equal(lerMargens(''), null)
  assert.equal(lerMargens('width:604px'), null)
  assert.equal(lerMargens('margin:dez'), null)
  assert.equal(lerMargens('margin:1px 2px 3px 4px 5px'), null)
  assert.equal(lerMargens('margin-left:28'), null)
})

test('escreve no formato antigo', () => {
  assert.equal(escreverMargens(ALINHADA_AO_TEXTO), 'margin:10px auto 10px 28px')
  assert.equal(escreverMargens({ esquerda: '28px' }), 'margin:0 auto 0 28px')
  assert.equal(escreverMargens({}), '')
  assert.deepEqual(lerMargens(escreverMargens(ALINHADA_AO_TEXTO)), ALINHADA_AO_TEXTO)
})
