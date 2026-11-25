const { test } = require('node:test')
const assert = require('node:assert/strict')
const { versaoDoSei, seiTestado } = require('../comum/sei.js')

// Versão do SEI: vem do endereço do script "js/sei.js?<versão>" das páginas do SEI.
test('versaoDoSei lê a versão do endereço do script e completa com zeros', () => {
  assert.equal(versaoDoSei('js/sei.js?3.0.15'), '3.0.15.0')
})

test('versaoDoSei ignora o que vem depois de "-" ou "="', () => {
  assert.equal(versaoDoSei('js/sei.js?4.0.12.15-abc'), '4.0.12.15')
  assert.equal(versaoDoSei('js/sei.js?3.1.7=x'), '3.1.7.0')
})

test('versaoDoSei devolve null sem versão no endereço', () => {
  assert.equal(versaoDoSei('js/sei.js'), null)
  assert.equal(versaoDoSei(''), null)
  assert.equal(versaoDoSei(null), null)
})

test('campo de senha: volta a ser de senha, sem a marca do SEI 5 (v0.1.1)', () => {
  const { atributosDoCampoDeSenha } = require('../comum/sei.js')
  // Atributos do campo visível da tela de assinatura do SEI 5 (depois do MaskedPassword).
  const atributos = [
    { name: 'id', value: 'pwdSenha' },
    { name: 'class', value: 'infraText masked' },
    { name: 'autocomplete', value: 'off' },
    { name: 'autocorrect', value: 'off' },
    { name: 'value', value: '●●●' },
    { name: 'maxlength', value: '100' },
    { name: 'onkeypress', value: 'return tratarSenha(event);' },
    { name: 'tabindex', value: '505' },
    { name: 'type', value: 'text' }
  ]
  const resultado = Object.fromEntries(atributosDoCampoDeSenha(atributos, 'pwdSenha'))
  assert.deepEqual(resultado, {
    id: 'pwdSenha',
    class: 'infraText',
    maxlength: '100',
    onkeypress: 'return tratarSenha(event);',
    tabindex: '505',
    type: 'password',
    name: 'pwdSenha',
    autocomplete: 'current-password'
  })
})

test('campo de senha: tela de entrada (sem classe além de masked fica sem class)', () => {
  const { atributosDoCampoDeSenha } = require('../comum/sei.js')
  const resultado = Object.fromEntries(atributosDoCampoDeSenha([{ name: 'class', value: 'masked' }]))
  assert.equal('class' in resultado, false)
  assert.equal(resultado.name, 'pwdSenha')
})

test('seiTestado: só a versão 5.0.4 do SEI conta como testada', () => {
  assert.equal(seiTestado('5.0.4.0'), true)
  assert.equal(seiTestado('5.0.4.2'), true)
  assert.equal(seiTestado('5.0.5.0'), false)
  assert.equal(seiTestado(null), false)
})

// v0.28.0 (spec aviso-versao-sei): perguntar, ligada ou desligada, só para a versão em que a pessoa escolheu.
test('estadoNoSei: versão testada nunca pergunta, mesmo com escolha antiga', () => {
  const { estadoNoSei, VERSAO_SEI_TESTADA } = require('../comum/sei.js')
  assert.equal(estadoNoSei(VERSAO_SEI_TESTADA + '.2'), 'testado')
  assert.equal(estadoNoSei(VERSAO_SEI_TESTADA + '.0', { versao: VERSAO_SEI_TESTADA, ligada: false }), 'testado')
  assert.equal(estadoNoSei(null), 'testado')
})

test('estadoNoSei: versão nova pergunta; a escolha vale só para a mesma versão', () => {
  const { estadoNoSei } = require('../comum/sei.js')
  assert.equal(estadoNoSei('9.1.0.0'), 'perguntar')
  assert.equal(estadoNoSei('9.1.0.3', { versao: '9.1.0', ligada: true }), 'ligada')
  assert.equal(estadoNoSei('9.1.0.3', { versao: '9.1.0', ligada: false }), 'desligada')
  assert.equal(estadoNoSei('9.2.0.0', { versao: '9.1.0', ligada: false }), 'perguntar')
})

// v0.36.1: abrir o primeiro documento incluído.
test('primeiro documento incluído', () => {
  const { linkDaArvoreComDocumento, primeiroIncluido } = require('../comum/sei.js')
  const link = "var l = 'controlador.php?acao=procedimento_visualizar&acao_origem=arvore_visualizar&id_procedimento=9&id_documento=77&infra_hash=ab';"
  assert.deepEqual(linkDaArvoreComDocumento(link), { id: '77', link: 'controlador.php?acao=procedimento_visualizar&acao_origem=arvore_visualizar&id_procedimento=9&id_documento=77&infra_hash=ab' })
  assert.equal(linkDaArvoreComDocumento(link.replace('=77', '=')), null)
  assert.equal(primeiroIncluido([{ id: '80' }, { id: '77', link: 'x' }], [], []).id, '77')
  assert.equal(primeiroIncluido([], ['5', '70'], ['5', '70', '71', '72']).id, '71')
  assert.equal(primeiroIncluido([], ['5', '70'], ['5', '70']), null)
})
