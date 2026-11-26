const { test } = require('node:test')
const assert = require('node:assert/strict')
const r = require('../comum/formatacao-agu.js')

test('"Justificativa Modificação Item(ns)": espaços, maiúsculas e acentos não contam (Edital 3399512, TR 3399829)', () => {
  assert.equal(r.ehJustificativa('Justificativa Modificação Item(ns)'), true)
  assert.equal(r.ehJustificativa('  JUSTIFICATIVA  MODIFICACAO ITEM(NS) '), true)
  assert.equal(r.ehJustificativa('Justificativa Modificação Item(ns) '), true)
  assert.equal(r.ehJustificativa('Justificativa Modificação Item(ns):'), true)
  // Parágrafo com mais texto é parte do documento: fica.
  assert.equal(r.ehJustificativa('Justificativa Modificação Item(ns) 3.1 alterado pela AGU'), false)
  assert.equal(r.ehJustificativa('Justificativa'), false)
  assert.equal(r.ehJustificativa(''), false)
})

test('ligação de comentário do Word: só "#_msocom_N" (Contrato 3399534)', () => {
  assert.equal(r.ehLinkComentarioWord('#_msocom_1'), true)
  assert.equal(r.ehLinkComentarioWord('#_MSOCOM_14'), true)
  assert.equal(r.ehLinkComentarioWord('#_ftn1'), false)
  assert.equal(r.ehLinkComentarioWord('https://www.gov.br/#_msocom_1'), false)
  assert.equal(r.textoDoLinkSai(' '), true)
  assert.equal(r.textoDoLinkSai('[GPO1]'), true)
  assert.equal(r.textoDoLinkSai('ver item 3'), false)
})

test('cores: preta não conta, branca é apagada (D9), o resto fica preto', () => {
  for (const cor of ['black', 'windowtext', 'hsl(0,0%,0%)', 'rgb(0, 0, 0)', '#000', 'initial', 'unset', '']) assert.equal(r.tipoDaCor(cor), 'preta', cor)
  for (const cor of ['white', '#FFFFFF', 'rgb(255,255,255)', 'hsl(0, 0%, 100%)']) assert.equal(r.tipoDaCor(cor), 'branca', cor)
  for (const cor of ['red', '#FF0000', '#0070C0', '#00B050', '#0000EF', 'hsl(0,0%,30%)', '#e6e6e6', 'var(--x)']) assert.equal(r.tipoDaCor(cor), 'colorida', cor)
})

test('espaço ao tirar o riscado (D3)', () => {
  // "valor<s>total </s>estimado" -> "valor estimado"
  assert.deepEqual(r.espacoAoJuntar('r', 'e'), { inserir: true, tirar: false })
  // "valor <s>total</s> estimado" -> um espaço só
  assert.deepEqual(r.espacoAoJuntar(' ', ' '), { inserir: false, tirar: true })
  assert.deepEqual(r.espacoAoJuntar(' ', 'e'), { inserir: false, tirar: false })
  // Pontuação e parênteses não ganham espaço.
  assert.deepEqual(r.espacoAoJuntar('r', ','), { inserir: false, tirar: false })
  assert.deepEqual(r.espacoAoJuntar('r', ')'), { inserir: false, tirar: false })
  assert.deepEqual(r.espacoAoJuntar('(', 'e'), { inserir: false, tirar: false })
  // Começo ou fim do parágrafo, ou do lado de uma imagem: nada.
  assert.deepEqual(r.espacoAoJuntar('', 'e'), { inserir: false, tirar: false })
  assert.deepEqual(r.espacoAoJuntar('r', ''), { inserir: false, tirar: false })
  assert.deepEqual(r.espacoAoJuntar(r.OBJETO, 'e'), { inserir: false, tirar: false })
})

test('parágrafo sem texto depois de tirar o riscado (D4)', () => {
  assert.equal(r.ficouSemTexto(''), true)
  assert.equal(r.ficouSemTexto('   '), true)
  assert.equal(r.ficouSemTexto('a'), false)
  assert.equal(r.ficouSemTexto(r.OBJETO), false)
})

test('linha da lista: trecho riscado com algumas palavras em volta', () => {
  const linha = r.trechoComVolta('realizará licitação, para registro de preços, na modalidade ', '[CONCORRÊNCIA] OU ', 'PREGÃO ELETRÔNICO, na forma ELETRÔNICA, nos termos da Lei')
  assert.deepEqual(linha, { antes: '…registro de preços, na modalidade ', riscado: '[CONCORRÊNCIA] OU', depois: 'PREGÃO ELETRÔNICO, na forma ELETRÔNICA,…' })
  const longo = r.trechoComVolta('', 'a'.repeat(300), '')
  assert.ok(longo.riscado.length < 150)
})
