const { test } = require('node:test')
const assert = require('node:assert/strict')
const manifesto = require('../manifest.json')

// Converte o padrão do manifest ("*" = qualquer coisa) em expressão regular, para conferir os endereços.
function casa (padrao, endereco) {
  const re = padrao.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp('^' + re + '$').test(endereco)
}
function scriptsDo (endereco) {
  return manifesto.content_scripts
    .filter(c => c.matches.some(p => casa(p, endereco)))
    .flatMap(c => c.js)
}

// v0.18.4: a janela de assinatura aberta pela árvore começa com "?acao="; a aberta pelo editor, com "?id_documento=".
const PELA_ARVORE = 'https://sei.ifto.edu.br/sei/controlador.php?acao=documento_assinar&acao_origem=arvore_visualizar&id_documento=1'
const PELO_EDITOR = 'https://sei.ifto.edu.br/sei/controlador.php?id_documento=3666817&acao=documento_assinar&acao_origem=editor_montar&acao_retorno=editor_montar'

test('campo de senha e "Assinar e próximo" rodam na janela de assinatura aberta pela árvore e pelo editor', () => {
  for (const endereco of [PELA_ARVORE, PELO_EDITOR]) {
    const js = scriptsDo(endereco)
    assert.ok(js.includes('sites/sei/campo-senha.js'), endereco)
    assert.ok(js.includes('sites/sei/assinar-e-proximo.js'), endereco)
  }
})

test('campo de senha não roda em página que só voltou da assinatura', () => {
  const js = scriptsDo('https://sei.ifto.edu.br/sei/controlador.php?acao=arvore_visualizar&acao_origem=documento_assinar')
  assert.ok(!js.includes('sites/sei/campo-senha.js'))
})

// v0.21.5 (T106 falhou): no Firefox o fundo carrega só a lista "background.scripts"; no Chrome, o importScripts
// do fundo.js. Um arquivo que falte na lista do Firefox quebra o fundo só lá (foi o caso de configuracoes.js).
test('fundo do Firefox carrega tudo o que o fundo do Chrome carrega', () => {
  const fs = require('node:fs')
  const fundo = fs.readFileSync(require.resolve('../fundo/fundo.js'), 'utf8')
  const importados = (fundo.match(/importScripts\(([^)]*)\)/) || [])[1].match(/'\/([^']+)'/g).map(s => s.slice(2, -1))
  for (const arquivo of importados) assert.ok(manifesto.background.scripts.includes(arquivo), arquivo)
})
