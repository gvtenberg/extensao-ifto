const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PADROES, comPadroes } = require('../comum/configuracoes.js')

test('documento externo novo começa com o preenchimento ligado (v0.6.0)', () => {
  assert.equal(PADROES.preencherDocumentoExterno, true)
})

test('comPadroes usa o padrão quando nada foi gravado', () => {
  assert.deepEqual(comPadroes(undefined), PADROES)
  assert.deepEqual(comPadroes({}), PADROES)
})

test('comPadroes mantém o que o usuário gravou', () => {
  assert.equal(comPadroes({ preencherDocumentoExterno: false }).preencherDocumentoExterno, false)
})

test('comPadroes ignora opções que não existem mais', () => {
  assert.equal('opcaoAntiga' in comPadroes({ opcaoAntiga: 1 }), false)
  assert.equal('novoDocumentoSempreVisivel' in comPadroes({ novoDocumentoSempreVisivel: true }), false)
})

test('lista de assinaturas começa automática (só na Direção-geral) e guarda a escolha (v0.3.0)', () => {
  assert.equal(PADROES.listaAssinaturas, 'automatica')
  assert.equal(comPadroes({ listaAssinaturas: 'sempre' }).listaAssinaturas, 'sempre')
})

test('documentos do pagamento começam automáticos (só na CGOC) (v0.7.0)', () => {
  assert.equal(PADROES.documentosPagamento, undefined) // v0.18.0: botão dos documentos em branco saiu
})

test('SICAF automático começa automático (só na CGOC) (v0.10.0)', () => {
  assert.equal(PADROES.incluirSicaf, 'automatica')
  assert.equal(comPadroes({ incluirSicaf: 'sempre' }).incluirSicaf, 'sempre')
})
