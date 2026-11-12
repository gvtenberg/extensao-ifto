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

test('lista de assinaturas começa automática (só na Direção-geral) e guarda a escolha (v0.3.0)', () => {
  assert.equal(PADROES.listaAssinaturas, 'automatica')
  assert.equal(comPadroes({ listaAssinaturas: 'sempre' }).listaAssinaturas, 'sempre')
})
