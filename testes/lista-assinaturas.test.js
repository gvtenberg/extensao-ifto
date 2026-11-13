const { test } = require('node:test')
const assert = require('node:assert/strict')
const lista = require('../comum/lista-assinaturas.js')

// Linhas no formato do arquivo de exemplo do usuário (12/11/2026).
const EXEMPLO = [
  '23236.021417/2026-95 - 3383423 dar ciência',
  '23236.022730/2026-41 - 3383754 edital e todos os anexos',
  '23236.011766/2026-07 - 3383812',
  '',
  '23235.022688/2026-78 - 3383283'
].join('\n')

test('lê o formato "processo - documento comentário"', () => {
  const { itens, erros } = lista.lerLista(EXEMPLO)
  assert.equal(erros.length, 0)
  assert.equal(itens.length, 4)
  assert.deepEqual(itens[0], {
    processo: '23236.021417/2026-95', documento: '3383423', comentario: 'dar ciência', ciencia: true, feito: false
  })
  assert.equal(itens[1].comentario, 'edital e todos os anexos')
  assert.equal(itens[1].ciencia, false)
  assert.equal(itens[2].comentario, '')
})

test('aceita só o processo, com ou sem comentário', () => {
  assert.deepEqual(lista.lerLinha('23236.011766/2026-07'),
    { processo: '23236.011766/2026-07', documento: '', comentario: '', ciencia: false, feito: false })
  const item = lista.lerLinha('23236.011766/2026-07 verificar 2026')
  assert.equal(item.documento, '')
  assert.equal(item.comentario, 'verificar 2026')
})

test('aceita só o número do documento', () => {
  const item = lista.lerLinha('3383423 dar ciencia')
  assert.equal(item.processo, '')
  assert.equal(item.documento, '3383423')
  assert.equal(item.ciencia, true)
})

test('aceita colunas de planilha e separadores variados', () => {
  for (const linha of [
    '23236.021417/2026-95\t3383423\tdar ciência',
    '23236.021417/2026-95;3383423;dar ciência',
    '23236.021417/2026-95, 3383423, dar ciência',
    '23236.021417/2026-95 3383423 dar ciência',
    '23236.021417/2026-95 – 3383423 – dar ciência',
    '• 23236.021417/2026-95 - 3383423 dar ciência'
  ]) {
    const item = lista.lerLinha(linha)
    assert.equal(item.processo, '23236.021417/2026-95', linha)
    assert.equal(item.documento, '3383423', linha)
    assert.equal(item.comentario, 'dar ciência', linha)
  }
  const semDocumento = lista.lerLinha('23236.021417/2026-95\t\tverificar')
  assert.equal(semDocumento.documento, '')
  assert.equal(semDocumento.comentario, 'verificar')
})

test('linhas não reconhecidas vão para os erros, com o número da linha', () => {
  const { itens, erros } = lista.lerLista('23236.0214/2026-95 - 3383423\n23236.021417/2026-95\nassinar tudo')
  assert.equal(itens.length, 1)
  assert.deepEqual(erros, [
    { numero: 1, texto: '23236.0214/2026-95 - 3383423' },
    { numero: 3, texto: 'assinar tudo' }
  ])
})

test('pesquisa pelo documento; sem documento, pelo processo', () => {
  assert.equal(lista.textoDaPesquisa({ processo: '23236.011766/2026-07', documento: '3383812' }), '3383812')
  assert.equal(lista.textoDaPesquisa({ processo: '23236.011766/2026-07', documento: '' }), '23236.011766/2026-07')
})

test('função ligada: automática só na Direção-geral', () => {
  assert.equal(lista.funcaoLigada('automatica', 'PAL/REI/IFTO'), true)
  assert.equal(lista.funcaoLigada('automatica', ' pal/rei/ifto \n'), true)
  assert.equal(lista.funcaoLigada('automatica', 'PAL/CGOC/IFTO'), false)
  assert.equal(lista.funcaoLigada('automatica', ''), false)
  assert.equal(lista.funcaoLigada('sempre', 'PAL/CGOC/IFTO'), true)
  assert.equal(lista.funcaoLigada('desligada', 'PAL/REI/IFTO'), false)
})

test('contador "8/28 · 7 feitos"', () => {
  const itens = Array.from({ length: 28 }, (_, i) => ({ feito: i < 7 }))
  assert.equal(lista.textoDoContador({ itens, posicao: 7 }), '8/28 · 7 feitos')
  assert.equal(lista.textoDoContador({ itens: [{ feito: true }], posicao: 0 }), '1/1 · 1 feito')
})

test('limitarPosicao fica dentro da lista', () => {
  assert.equal(lista.limitarPosicao(-1, 5), 0)
  assert.equal(lista.limitarPosicao(9, 5), 4)
  assert.equal(lista.limitarPosicao(2, 0), 0)
})

test('próximo pendente: depois da posição, senão o primeiro antes; todos feitos: -1', () => {
  const itens = [{ feito: false }, { feito: true }, { feito: false }, { feito: true }]
  assert.equal(lista.proximoPendente(itens, 0), 2)
  assert.equal(lista.proximoPendente(itens, 2), 0)
  assert.equal(lista.proximoPendente(itens.map(() => ({ feito: true })), 1), -1)
})

// v0.9.2: intervalo de documentos numa linha.
test('intervalo: "processo - 3383754-3383903", " - " e " a "', () => {
  for (const linha of ['23236.022730/2026-41 - 3383754-3383903', '23236.022730/2026-41 - 3383754 - 3383903', '23236.022730/2026-41 3383754 a 3383903 edital']) {
    const item = lista.lerLinha(linha)
    assert.equal(item.processo, '23236.022730/2026-41')
    assert.equal(item.documento, '3383754')
    assert.equal(item.ate, '3383903')
  }
  assert.equal(lista.lerLinha('23236.022730/2026-41 3383754 a 3383903 edital').comentario, 'edital')
  const semProcesso = lista.lerLinha('3383754 a 3383903')
  assert.equal(semProcesso.processo, '')
  assert.equal(semProcesso.ate, '3383903')
  assert.equal(lista.lerLinha('3383903 - 3383754').documento, '3383754')
  assert.equal(lista.lerLinha('3383754 - 3383754').ate, undefined)
  // Sem segundo número continua sendo um documento só, com comentário.
  const simples = lista.lerLinha('23236.022730/2026-41 - 3383754 assinar tudo')
  assert.equal(simples.ate, undefined)
  assert.equal(simples.comentario, 'assinar tudo')
})

test('intervalo: pesquisa abre o processo; sem processo, o primeiro documento', () => {
  assert.equal(lista.textoDaPesquisa({ processo: '23236.022730/2026-41', documento: '3383754', ate: '3383903' }), '23236.022730/2026-41')
  assert.equal(lista.textoDaPesquisa({ processo: '', documento: '3383754', ate: '3383903' }), '3383754')
})

test('intervalo: só os documentos do processo entre os dois números, do menor ao maior', () => {
  const item = lista.lerLinha('3383754 a 3383903 ciência')
  const rotulos = ['23236.022730/2026-41', 'Edital (3383760)', 'Anexo I (3383754)', 'Despacho 1 (3383500)', 'Anexo II (3383903)', 'Anexo I (3383754)', 'Ofício (3383904)', 'II']
  const itens = lista.expandirIntervalo(item, rotulos, '23236.022730/2026-41')
  assert.deepEqual(itens.map(i => i.documento), ['3383754', '3383760', '3383903'])
  assert.equal(itens[0].processo, '23236.022730/2026-41')
  assert.equal(itens[0].ciencia, true)
  assert.equal(itens[0].doIntervalo, '3383754 a 3383903')
  assert.equal(lista.numeroDoRotulo('Despacho 163 (3229092)'), '3229092')
  assert.deepEqual(lista.expandirIntervalo(item, ['Ofício (3383904)'], ''), [])
})

// v0.9.3: externos ficam de fora do intervalo, menos em item de ciência.
test('intervalo: documentos externos ficam de fora, menos para dar ciência', () => {
  const rotulos = ['Despacho (3383754)', 'Nota Fiscal (3383760)', 'Ofício (3383800)']
  const assinar = lista.lerLinha('23236.022730/2026-41 - 3383754-3383903')
  assert.deepEqual(lista.expandirIntervalo(assinar, rotulos, '', ['3383760']).map(i => i.documento), ['3383754', '3383800'])
  const ciencia = lista.lerLinha('23236.022730/2026-41 - 3383754-3383903 dar ciência')
  assert.equal(lista.expandirIntervalo(ciencia, rotulos, '', ['3383760']).length, 3)
})

test('v0.9.6: vários documentos na mesma linha, separados por vírgula, ponto e vírgula, "e" ou espaço', () => {
  const { itens, erros } = lista.lerLista('23236.022824/2026-10 - 3384598, 3384598, 3384645, 3384674')
  assert.equal(erros.length, 0)
  assert.deepEqual(itens.map(i => i.documento), ['3384598', '3384645', '3384674'])
  assert.ok(itens.every(i => i.processo === '23236.022824/2026-10' && i.comentario === '' && !i.ate))
  for (const linha of ['3384598; 3384645 e 3384674 dar ciência', '3384598 3384645 3384674 dar ciência']) {
    const lidos = lista.lerLista(linha).itens
    assert.deepEqual(lidos.map(i => i.documento), ['3384598', '3384645', '3384674'])
    assert.ok(lidos.every(i => i.ciencia && i.comentario === 'dar ciência'))
  }
  // Mistura de documento e intervalo; o primeiro item da linha continua em lerLinha.
  const mistura = lista.lerLista('23236.022824/2026-10 - 3384598, 3384600 a 3384674 edital').itens
  assert.deepEqual(mistura.map(i => [i.documento, i.ate || '']), [['3384598', ''], ['3384600', '3384674']])
  assert.equal(mistura[1].comentario, 'edital')
  assert.equal(lista.lerLinha('23236.022824/2026-10 - 3384598, 3384645').documento, '3384598')
})

test('v0.9.6: a mesma linha escrita como intervalo', () => {
  const item = lista.lerLinha('23236.022824/2026-10 - 3384598 a 3384674')
  assert.equal(item.processo, '23236.022824/2026-10')
  assert.equal(item.documento, '3384598')
  assert.equal(item.ate, '3384674')
})
