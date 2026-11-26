const { test } = require('node:test')
const assert = require('node:assert/strict')
const r = require('../comum/numeracao-digitada.js')

test('caixa escondida: só <div> sem atributos com item numerado dentro (Minuta de Ata 3399532)', () => {
  assert.equal(r.caixaQueAtrapalha({ atributos: [], estilosDentro: ['Item_nivel_1_Edital_titulo', 'Texto_Justificado'] }), true)
  assert.equal(r.caixaQueAtrapalha({ atributos: [], estilosDentro: ['Item_Nivel1'] }), true)
  // A caixa do SEI com counter-reset e a caixa "Processo/Interessado/Assunto" têm estilo: ficam.
  assert.equal(r.caixaQueAtrapalha({ atributos: ['htmlDivAttributes'], estilosDentro: ['Item_nivel_2_Edital'] }), false)
  // Caixa só com texto normal não atrapalha a numeração.
  assert.equal(r.caixaQueAtrapalha({ atributos: [], estilosDentro: ['Texto_Justificado', 'IFTO_Tabela_Texto_Centralizado'] }), false)
  assert.equal(r.caixaQueAtrapalha({}), false)
})

test('lê o número digitado no começo do parágrafo', () => {
  assert.deepEqual(r.lerNumeroDigitado('3.1. O órgão gerenciador'), { numero: '3.1', partes: [3, 1], nivel: 2, tamanho: 5 })
  assert.equal(r.lerNumeroDigitado('4.2.1.   apresentação').nivel, 3)
  assert.equal(r.lerNumeroDigitado('4.2.1.   apresentação').tamanho, 9)
  assert.equal(r.lerNumeroDigitado(' 4.11. É vedado').numero, '4.11')
  assert.equal(r.lerNumeroDigitado('5.9 Após a homologação').numero, '5.9')
  assert.equal(r.lerNumeroDigitado('5.4.2.1. Aceitarem').nivel, 4)
})

test('não confunde texto comum com número digitado', () => {
  assert.equal(r.lerNumeroDigitado('3. DO OBJETO'), null)
  assert.equal(r.lerNumeroDigitado('Dos limites para as adesões'), null)
  assert.equal(r.lerNumeroDigitado('R$ 1.234,56 por mês'), null)
  assert.equal(r.lerNumeroDigitado('1.234,56 reais'), null)
  assert.equal(r.lerNumeroDigitado('4.1.'), null)
  assert.equal(r.lerNumeroDigitado('1.2.3.4.5. demais'), null)
  assert.equal(r.lerNumeroDigitado(''), null)
})

test('estilo novo: família Item_Nivel, ou a do Edital quando o SEI não deixa', () => {
  assert.equal(r.estiloPara(2), 'Item_Nivel2')
  assert.equal(r.estiloPara(4), 'Item_Nivel4')
  assert.equal(r.estiloPara(3, 'edital'), 'Item_nivel_3_Edital')
  assert.equal(r.estiloPara(1), '')
  assert.equal(r.estiloPara(5), '')
})

test('número que a numeração automática vai mostrar (4.1 apagado: o digitado 4.2 vira 4.1)', () => {
  assert.deepEqual(r.numerar([1, 2, 2, 1, 2, 3, 3, 2, null, 2, 1, 2, 3, 4]),
    ['1', '1.1', '1.2', '2', '2.1', '2.1.1', '2.1.2', '2.2', '', '2.3', '3', '3.1', '3.1.1', '3.1.1.1'])
  assert.deepEqual(r.numerar([1, 2, 0, 1, 2]), ['1', '1.1', '', '1', '1.1'])
  assert.deepEqual(r.numerar([]), [])
})

test('estilos numerados e seus níveis', () => {
  assert.equal(r.nivelDoEstilo('Item_Nivel1'), 1)
  assert.equal(r.nivelDoEstilo('Item_nivel_1_Edital_titulo'), 1)
  assert.equal(r.nivelDoEstilo('Item_nivel_3_Edital'), 3)
  assert.equal(r.nivelDoEstilo('Texto_Justificado'), null)
  assert.equal(r.ehNumerado('Item_Inciso_Romano'), true)
  assert.equal(r.ehNumerado('Texto_Justificado'), false)
  assert.equal(r.ehNumerado(undefined), false)
})
