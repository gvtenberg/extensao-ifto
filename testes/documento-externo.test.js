const { test } = require('node:test')
const assert = require('node:assert/strict')
const { ehDocumentoExternoNovo, dataDeHoje, oQuePreencher } = require('../comum/documento-externo.js')

// v0.6.0: só o documento externo novo é preenchido; o que já existe no SEI não muda.
test('documento externo novo: página documento_receber', () => {
  assert.equal(ehDocumentoExternoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=documento_receber&acao_origem=documento_escolher_tipo&id_serie=-1'), true)
  assert.equal(ehDocumentoExternoNovo('controlador.php?acao=documento_receber&acao_origem=documento_receber'), true)
})

test('documento externo que já existe não é novo', () => {
  assert.equal(ehDocumentoExternoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=documento_alterar_recebido&id_documento=1'), false)
  assert.equal(ehDocumentoExternoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=documento_escolher_tipo&acao_origem=documento_receber'), false)
  assert.equal(ehDocumentoExternoNovo(''), false)
})

test('data de hoje no formato do SEI', () => {
  assert.equal(dataDeHoje(new Date(2026, 10, 12)), '12/11/2026')
  assert.equal(dataDeHoje(new Date(2027, 0, 5)), '05/01/2027')
})

test('preenche só o que está vazio', () => {
  assert.deepEqual(oQuePreencher({ data: '', formatoMarcado: false, nivelMarcado: false }), { data: true, formato: true, nivel: true })
  assert.deepEqual(oQuePreencher({ data: '01/11/2026', formatoMarcado: true, nivelMarcado: true }), { data: false, formato: false, nivel: false })
  assert.deepEqual(oQuePreencher({ data: '  ', formatoMarcado: true, nivelMarcado: false }), { data: true, formato: false, nivel: true })
})
