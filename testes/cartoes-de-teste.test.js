const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { lerTestes, corpoDoCartao, resultadoDoCartao, numeroDoCartao } = require('../.github/scripts/testes-pendentes.js')

const exemplo = `# Testes pendentes

## Senha (v0.1.1)

### T08 – Senha na tela de entrada (v0.1.1)

- O que fazer: abrir.
- O que deve acontecer: preencher.
- Resultado: \\[ \\]
- Observação:

## Perguntas

### P1 – Arquivo grande

Que dica mostrar?
`

test('lerTestes acha testes e perguntas, com a seção', () => {
  const itens = lerTestes(exemplo)
  assert.deepEqual(itens.map(i => [i.numero, i.titulo, i.secao]), [
    ['T08', 'Senha na tela de entrada (v0.1.1)', 'Senha (v0.1.1)'],
    ['P1', 'Arquivo grande', 'Perguntas']
  ])
})

test('corpoDoCartao tira Resultado/Observação e põe as caixinhas (pergunta: só comentário)', () => {
  const [teste, pergunta] = lerTestes(exemplo)
  const corpo = corpoDoCartao(teste)
  assert.ok(corpo.includes('- [ ] ✅ Passou') && corpo.includes('- [ ] ❌ Falhou'))
  assert.ok(!corpo.includes('Resultado: \\['))
  assert.ok(corpo.endsWith('<!-- teste:T08 -->'))
  assert.ok(!corpoDoCartao(pergunta).includes('Passou'))
})

test('resultadoDoCartao lê a caixinha clicada', () => {
  const corpo = corpoDoCartao(lerTestes(exemplo)[0])
  assert.equal(resultadoDoCartao(corpo), 'não marcado')
  assert.equal(resultadoDoCartao(corpo.replace('- [ ] ✅', '- [x] ✅')), 'passou')
  assert.equal(resultadoDoCartao(corpo.replace('- [ ] ❌', '- [x] ❌')), 'falhou')
  assert.equal(numeroDoCartao({ body: corpo }), 'T08')
  assert.equal(numeroDoCartao({ title: 'T09 – Algo', body: '' }), 'T09')
})

test('o TESTES-PENDENTES.md real tem números únicos', () => {
  const texto = fs.readFileSync(path.join(__dirname, '..', 'TESTES-PENDENTES.md'), 'utf8')
  const numeros = lerTestes(texto).map(i => i.numero)
  assert.equal(new Set(numeros).size, numeros.length)
  assert.ok(numeros.includes('T12'))
})
