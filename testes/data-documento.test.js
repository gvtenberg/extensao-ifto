const { test } = require('node:test')
const assert = require('node:assert/strict')
const { ehOficioOuPortaria, acharData, dataPassou, dataCurta, datasDoDocumento, conferirData, corrigirData, fraseAntesDeAssinar } = require('../comum/data-documento.js')
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

// v0.26.9 (spec conferir-documento, etapa 8): data de todo documento ainda não assinado.
const p = (html, nome = 's', editavel = true) => ({ nome, editavel, html })

test('acha a data no alto, no fim do corpo e no título, nunca nas datas citadas', () => {
  const despacho = '<p class="IFTO_Alin_direita">Palmas, 17 de novembro de 2026.</p><p>Processo nº: 23236.023147/2026-57</p>'
  assert.deepEqual(datasDoDocumento([p(despacho)]).map(d => [d.tipo, d.dia, d.mes, d.ano]), [['cidade', 17, 11, 2026]])
  const ateste = '<p>Valor: R$ 914,60</p><p class="IFTO_Alin_direita_sem_espaço">Palmas, 09&nbsp;de setembro de 2026.</p><p class="IFTO_Assinatura">FULANO</p>'
  assert.equal(datasDoDocumento([p(ateste)])[0].diaEscrito, '09')
  const portaria = '<p class="Texto_Centralizado_Maiusculas">PORTARIA CGOC/GAC/DAP/PAL/REI/IFTO&nbsp;nº 1/2026, de 18 de novembro de 2026</p>'
  assert.equal(datasDoDocumento([p(portaria, 'id', false)])[0].tipo, 'titulo')
  assert.equal(datasDoDocumento([p('<p>EDITAL Nº 75/2026/PAL/REI/IFTO, DE 18 DE NOVEMBRO DE 2026</p>')])[0].mes, 11)
  const corpo = '<p>Conforme a Portaria nº 379/2022, de 07 de abril de 2022.</p><p>Lei nº 12.711, de 29 de agosto de 2012, alterada.</p>'
  assert.deepEqual(datasDoDocumento([p(corpo)]), [])
  assert.deepEqual(datasDoDocumento([p('<p>Documento assinado eletronicamente por Fulano, em 18/11/2026</p>')]), [])
  // Título só nos primeiros parágrafos do documento.
  const muitos = '<p>linha</p>'.repeat(20) + '<p>Portaria nº 810/2026, de 10 de novembro de 2026</p>'
  assert.deepEqual(datasDoDocumento([p(muitos)]), [])
})

test('data errada: mês, ano, dia que não chegou; Ofício e Portaria também dia que passou', () => {
  const linha = data => [p(`<p>Palmas, ${data}.</p>`)]
  assert.equal(conferirData(linha('12 de novembro de 2026'), HOJE).certo, true)
  const mes = conferirData(linha('12 de outubro de 2026'), HOJE)
  assert.equal(mes.errada, true)
  assert.equal(mes.problemas[0], 'O mês ou o ano está errado: o texto diz 12 de outubro de 2026, mas hoje é 18 de novembro de 2026.')
  assert.equal(mes.nova, '18 de novembro de 2026')
  assert.equal(fraseAntesDeAssinar(mes), 'Data errada: o texto diz 12 de outubro de 2026, mas hoje é 18 de novembro de 2026.')
  assert.equal(conferirData(linha('18 de novembro de 2025'), HOJE).errada, true)
  assert.match(conferirData(linha('20 de novembro de 2026'), HOJE).problemas[0], /ainda não chegou/)
  assert.equal(conferirData(linha('17 de novembro de 2026'), HOJE, { passouConta: true }).errada, true)
  assert.equal(conferirData([p('<p>Sem data</p>')], HOJE), null)
})

test('data fora do padrão: zero, º, mês maiúsculo, ponto final', () => {
  const um = new Date(2026, 11, 1)
  const zero = conferirData([p('<p>Palmas, 06 de novembro de 2026.</p>')], HOJE)
  assert.equal(zero.errada, false)
  assert.deepEqual(zero.problemas, ['Escreva o dia sem o zero na frente ("6 de", não "06 de").'])
  assert.equal(zero.nova, '6 de novembro de 2026')
  assert.deepEqual(conferirData([p('<p>Palmas, 1 de dezembro de 2026.</p>')], um).problemas, ['No primeiro dia do mês, escreva "1º de".'])
  assert.equal(conferirData([p('<p>Palmas, 1º de dezembro de 2026.</p>')], um).certo, true)
  assert.equal(conferirData([p('<p>Palmas, 1&ordm; de dezembro de 2026.</p>')], um).certo, true)
  assert.match(conferirData([p('<p>Palmas, 2º de dezembro de 2026.</p>')], new Date(2026, 11, 2)).problemas[0], /Só o dia 1/)
  assert.match(conferirData([p('<p>Palmas, 18 de Novembro de 2026.</p>')], HOJE).problemas[0], /minúscula/)
  assert.deepEqual(conferirData([p('<p>Palmas, 18 de novembro de 2026</p>')], HOJE).problemas, ['Falta o ponto final depois do ano.'])
  // Título em maiúsculas e sem ponto está certo.
  assert.equal(conferirData([p('<p>EDITAL Nº 75/2026/PAL/REI/IFTO, DE 18 DE NOVEMBRO DE 2026</p>')], HOJE).certo, true)
})

test('corrige a data no HTML: hoje quando errada, padrão quando só fora do padrão', () => {
  const ateste = '<p class="IFTO_Alin_direita_sem_espaço" data-c="31">Palmas, 09&nbsp;de setembro de 2026</p>'
  const conferido = conferirData([p(ateste)], HOJE)
  assert.equal(corrigirData(ateste, conferido), '<p class="IFTO_Alin_direita_sem_espaço" data-c="31">Palmas, 18&nbsp;de novembro de 2026.</p>')
  const zero = '<p>Palmas, <strong>06 de Novembro de 2026</strong>.</p>'
  assert.equal(corrigirData(zero, conferirData([p(zero)], HOJE)), '<p>Palmas, <strong>6 de novembro de 2026</strong>.</p>')
  const titulo = '<p>PORTARIA Nº 12/2026/PAL/REI/IFTO, DE 28 DE ABRIL DE 2026</p>'
  assert.equal(corrigirData(titulo, conferirData([p(titulo)], new Date(2026, 11, 1))), '<p>PORTARIA Nº 12/2026/PAL/REI/IFTO, DE 1º DE DEZEMBRO DE 2026</p>')
  assert.equal(corrigirData('<p>outro</p>', conferido), null)
})
