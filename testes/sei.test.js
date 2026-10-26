const { test } = require('node:test')
const assert = require('node:assert/strict')
const { versaoDoSei, extrairLinkNovoDocumento } = require('../comum/sei.js')

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

// Botão "Novo documento": o SEI antigo guarda o link no script da árvore (Nos[0].acoes = '<a ...>').
const linkIncluir = '<a href="controlador.php?acao=documento_escolher_tipo&amp;id_procedimento=1" tabindex="451"><img src="imagens/sei_incluir_documento.gif" title="Incluir Documento"/></a>'
const linkReceber = '<a href="controlador.php?acao=documento_receber&amp;id_procedimento=1" tabindex="452"><img title="Incluir Documento Externo"/></a>'

test('extrairLinkNovoDocumento acha o link de incluir documento no script da árvore', () => {
  const script = `Nos[0].acoes = '${linkIncluir}<a href="controlador.php?acao=procedimento_alterar">x</a>';`
  assert.equal(extrairLinkNovoDocumento(script), linkIncluir)
})

test('extrairLinkNovoDocumento usa o link de documento externo quando não há o de incluir', () => {
  assert.equal(extrairLinkNovoDocumento(`Nos[0].acoes = '${linkReceber}';`), linkReceber)
})

test('extrairLinkNovoDocumento prefere o de incluir quando há os dois', () => {
  assert.equal(extrairLinkNovoDocumento(`Nos[0].acoes = '${linkReceber}${linkIncluir}';`), linkIncluir)
})

test('extrairLinkNovoDocumento devolve null quando não há link', () => {
  assert.equal(extrairLinkNovoDocumento('Nos[0].acoes = \'\';'), null)
  assert.equal(extrairLinkNovoDocumento(''), null)
})
