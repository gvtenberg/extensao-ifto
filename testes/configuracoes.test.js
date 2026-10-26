const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PADROES, comPadroes } = require('../comum/configuracoes.js')

test('o botão Novo documento sempre visível começa ligado', () => {
  assert.equal(PADROES.novoDocumentoSempreVisivel, true)
})

test('comPadroes usa o padrão quando nada foi gravado', () => {
  assert.deepEqual(comPadroes(undefined), PADROES)
  assert.deepEqual(comPadroes({}), PADROES)
})

test('comPadroes mantém o que o usuário gravou', () => {
  assert.equal(comPadroes({ novoDocumentoSempreVisivel: false }).novoDocumentoSempreVisivel, false)
})

test('comPadroes ignora opções que não existem mais', () => {
  assert.equal('opcaoAntiga' in comPadroes({ opcaoAntiga: 1 }), false)
})
