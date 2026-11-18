const { test } = require('node:test')
const assert = require('node:assert/strict')
const { ehOficioOuPortaria, acharData, dataPassou, dataCurta, trocarData, secaoDaData } = require('../comum/data-documento.js')
const { tipoDoDocumento } = require('../comum/sei.js')

// Seção "Data" do Ofício 3163788 (editor de 18/11/2026, somente leitura).
const DATA_OFICIO = '<p class="IFTO_Alin_direita">Palmas, 28 de abril de 2026.</p>\n'
const HOJE = new Date(2026, 10, 18)

test('tipo do documento pelo título da janela do editor', () => {
  assert.equal(tipoDoDocumento('SEI/IFTO - 3163788 - Ofício'), 'Ofício')
  assert.equal(ehOficioOuPortaria('SEI/IFTO - 3163788 - Ofício'), true)
  assert.equal(ehOficioOuPortaria('SEI/IFTO - 3163788 - Oficio Circular'), true)
  assert.equal(ehOficioOuPortaria('SEI/IFTO - 3200000 - Portaria'), true)
  assert.equal(ehOficioOuPortaria('SEI/IFTO - 3384977 - Despacho'), false)
  assert.equal(ehOficioOuPortaria(''), false)
})

test('acha a data e diz se já passou', () => {
  const data = acharData(DATA_OFICIO)
  assert.deepEqual([data.dia, data.mes, data.ano], [28, 4, 2026])
  assert.equal(dataCurta(data), '28/04/2026')
  assert.equal(dataPassou(data, HOJE), true)
  assert.equal(dataPassou(acharData('Palmas, 18 de novembro de 2026.'), HOJE), false)
  assert.equal(dataPassou(acharData('Palmas, 2 de janeiro de 2027.'), HOJE), false)
  assert.equal(acharData('<p>OFÍCIO Nº&nbsp;9/2026/CGOC</p>'), null)
  assert.deepEqual(acharData('5&nbsp;de mar&ccedil;o de 2026').mes, 3)
})

test('troca só a data, no mesmo jeito de escrever', () => {
  assert.equal(trocarData(DATA_OFICIO, HOJE), '<p class="IFTO_Alin_direita">Palmas, 18 de novembro de 2026.</p>\n')
  assert.equal(trocarData('PORTARIA Nº 12/2026/PAL/REI/IFTO, DE 28 DE ABRIL DE 2026', HOJE), 'PORTARIA Nº 12/2026/PAL/REI/IFTO, DE 18 DE NOVEMBRO DE 2026')
  assert.equal(trocarData('Palmas, 07&nbsp;de Abril de 2026.', new Date(2026, 2, 3)), 'Palmas, 03&nbsp;de Março de 2026.')
  assert.equal(trocarData('Sem data', HOJE), 'Sem data')
})

test('escolhe a seção da data e nunca o corpo do texto', () => {
  const corpo = { nome: 'corpo', editavel: true, html: '<p>Conforme a Portaria nº 379/2022, de 07 de abril de 2022.</p>' }
  const travada = { nome: 'data', editavel: false, html: DATA_OFICIO }
  assert.equal(secaoDaData([corpo, travada]).nome, 'data')
  assert.equal(secaoDaData([corpo, { nome: 'data', editavel: true, html: DATA_OFICIO }]).nome, 'data')
  assert.equal(secaoDaData([corpo]), null)
})

test('Portaria de Pessoal 3390422: data no Identificador (somente leitura)', () => {
  const identificador = { nome: 'txaEditor_7042', editavel: false, html: '<p class="Texto_Centralizado_Maiusculas">PORTARIA CGOC/GAC/DAP/PAL/REI/IFTO&nbsp;nº 1/2026, de 10 de novembro de 2026</p>' }
  const preambulo = { nome: 'txaEditor_7044', editavel: true, html: '<p>nomeada pelo Decreto Presidencial de 12 de maio de 2026</p>' }
  const secao = secaoDaData([preambulo, identificador])
  assert.equal(secao.nome, 'txaEditor_7042')
  assert.equal(trocarData(secao.html, HOJE), '<p class="Texto_Centralizado_Maiusculas">PORTARIA CGOC/GAC/DAP/PAL/REI/IFTO&nbsp;nº 1/2026, de 18 de novembro de 2026</p>')
})
