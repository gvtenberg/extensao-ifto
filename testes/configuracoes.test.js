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

test('v0.18.2: cópia em Downloads de cada PDF ligada por padrão', () => {
  assert.equal(PADROES.copiaSicaf, true)
  assert.equal(PADROES.copiaConsulta, true)
  assert.equal(comPadroes({ copiaSicaf: false }).copiaSicaf, false)
})

test('peças do Compras IFTO começam automáticas (só na CCL) (v0.19.0)', () => {
  assert.equal(PADROES.comprasIfto, 'automatica')
  assert.equal(comPadroes({ comprasIfto: 'desligada' }).comprasIfto, 'desligada')
})

test('entrada com SerproID no Gov.br começa desligada (v0.21.3)', () => {
  assert.equal(PADROES.entrarComSerproId, false)
  assert.equal(comPadroes({ entrarComSerproId: true }).entrarComSerproId, true)
})

test('v0.26.0: conferências do documento ligadas e lista de unidades vazia, sem mexer no padrão', () => {
  for (const chave of ['conferirProcesso', 'conferirTimbre', 'conferirRodape', 'espacamentoDocumento']) assert.equal(PADROES[chave], true)
  const lida = comPadroes({})
  assert.deepEqual(lida.unidades, [])
  lida.unidades.push({ sigla: 'X' })
  assert.deepEqual(PADROES.unidades, [])
  assert.deepEqual(comPadroes({ unidades: [{ sigla: 'CGOC/PAL/REI/IFTO' }] }).unidades, [{ sigla: 'CGOC/PAL/REI/IFTO' }])
})

test('v0.26.1: copiar o nome de quem assinou ligado por padrão', () => {
  assert.equal(PADROES.copiarAssinaturas, true)
})
