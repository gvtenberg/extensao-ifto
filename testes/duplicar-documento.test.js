// Regras de duplicar documento (comum/duplicar-documento.js)
const test = require('node:test')
const assert = require('node:assert')
const d = require('../comum/duplicar-documento.js')
const { lerArvore } = require('../comum/sei.js')

const tipos = [{ id: '1', nome: 'Despacho' }, { id: '2', nome: 'Ofício' }, { id: '3', nome: 'Ofício Circular' }, { id: '4', nome: 'Folha de Encaminhamento' }]

test('acharTipo: pelo id do cadastro; id fora da lista não cai no nome', () => {
  assert.equal(d.acharTipo(tipos, '3', 'Qualquer 1').nome, 'Ofício Circular')
  assert.equal(d.acharTipo(tipos, '99', 'Despacho 3392797'), null)
})

test('acharTipo: pelo rótulo, o nome mais comprido e só quando há certeza', () => {
  assert.equal(d.acharTipo(tipos, '', 'Ofício Circular 3 (3376800)').id, '3')
  assert.equal(d.acharTipo(tipos, '', 'OFICIO 12 (3376800)').id, '2')
  assert.equal(d.acharTipo(tipos, '', 'Folha de Encaminhamento 269 (3376800)').id, '4')
  assert.equal(d.acharTipo(tipos, '', 'Despacho 3392797').id, '1')
  assert.equal(d.acharTipo(tipos, '', 'Despacho Decisório 3392797'), null)
  assert.equal(d.acharTipo(tipos, '', 'Despachos 3392797'), null)
})

test('podeDuplicar: só documento do editor, com número e com Incluir Documento', () => {
  const doc = { feitoNoSei: true, semConteudo: false, rotulo: 'Despacho 3392797' }
  assert.equal(d.podeDuplicar({ linkIncluir: 'x' }, doc), true)
  assert.equal(d.podeDuplicar({ linkIncluir: null }, doc), false)
  assert.equal(d.podeDuplicar({ linkIncluir: 'x' }, { ...doc, feitoNoSei: false }), false)
  assert.equal(d.podeDuplicar({ linkIncluir: 'x' }, { ...doc, rotulo: 'Despacho' }), false)
})

test('listas do SEI: ida e volta, sem repetidos', () => {
  const texto = '10±Campus Palmas¥20±Fundação - FAPTO'
  assert.deepEqual(d.lerLista(texto), [{ id: '10', nome: 'Campus Palmas' }, { id: '20', nome: 'Fundação - FAPTO' }])
  assert.equal(d.listaEmTexto(d.lerLista(texto)), texto)
  assert.deepEqual(d.lerLista(''), [])
  assert.equal(d.semRepetidos(d.lerLista(texto + '¥10±Campus Palmas')).length, 2)
})

test('nivelACopiar: público e restrito; sigiloso e não lido ficam sem marcar', () => {
  assert.equal(d.nivelACopiar({ nivel: '0' }), 'publico')
  assert.equal(d.nivelACopiar({ nivel: '1' }), 'restrito')
  assert.equal(d.nivelACopiar({ nivel: '2' }), '')
  assert.equal(d.nivelACopiar(null), '')
})

test('lerArvore: link do cadastro só no documento feito no SEI', () => {
  const arvore = `Nos[0] = new infraArvoreNo("DOCUMENTO","5","1","l","a","Despacho 3392797","t","svg/documento_interno.svg");
Nos[0].acoes = '<a href="controlador.php?acao=documento_alterar&amp;id_documento=5">';
Nos[1] = new infraArvoreNo("DOCUMENTO","6","1","l","a","Anexo 3392798","t","svg/documento_pdf.svg");
Nos[1].acoes = '<a href="controlador.php?acao=documento_alterar_recebido&amp;id_documento=6">';
`
  const { documentos } = lerArvore(arvore)
  assert.equal(documentos[0].linkCadastro, 'controlador.php?acao=documento_alterar&id_documento=5')
  assert.equal(documentos[1].linkCadastro, '')
})

test('v0.38.0: duplicar documento externo, sem o arquivo', () => {
  const lida = { linkIncluir: 'x' }
  assert.equal(d.podeDuplicarExterno(lida, { feitoNoSei: false, linkAlterar: 'a' }), true)
  assert.equal(d.podeDuplicarExterno(lida, { feitoNoSei: false, linkAlterar: '' }), false)
  assert.equal(d.podeDuplicarExterno(lida, { feitoNoSei: true, linkAlterar: 'a' }), false)
  const copia = d.camposDoExterno([['selSerie', '12'], ['txtNomeArvore', 'NF 63'], ['hdnAnexos', 'arq'], ['hdnIdDocumento', '99'], ['rdoNivelAcesso', '1'], ['selHipoteseLegal', '3']])
  assert.deepEqual(copia, { hdnIdSerie: '12', txtNomeArvore: 'NF 63', rdoNivelAcesso: '1', selHipoteseLegal: '3' })
})
