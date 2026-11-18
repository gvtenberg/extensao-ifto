const { test } = require('node:test')
const assert = require('node:assert/strict')
const { BLOCO, CSS, temCorrecao, LARGURAS } = require('../comum/numeracao-edital.js')

test('bloco de estilo só deixa a caixa do número crescer', () => {
  assert.match(BLOCO, /^<style>\/\* extensao-ifto: numeracao do edital \*\/.*<\/style>$/)
  assert.match(CSS, /box-sizing:border-box/)
  for (const [classe, largura] of Object.entries(LARGURAS)) assert.ok(CSS.includes('.' + classe + ':before{min-width:' + largura + '}'))
  assert.doesNotMatch(CSS, /MINUTA/)
})

test('reconhece a correção já posta (o editor tira os atributos do <style>)', () => {
  assert.equal(temCorrecao('<p class="Item_nivel_2_Edital"><style>/* extensao-ifto: numeracao do edital */.x{}</style>Texto</p>'), true)
  assert.equal(temCorrecao('<p class="Item_nivel_2_Edital">Texto</p>'), false)
  assert.equal(temCorrecao(''), false)
})

test('a marca MINUTA não confunde a correção com a marca d\'água', () => {
  const { temMarcaMinuta } = require('../comum/minuta-edital.js')
  assert.equal(temMarcaMinuta('<p>' + BLOCO + 'Texto</p>'), false)
})
