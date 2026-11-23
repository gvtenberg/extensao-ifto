const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const r = require('../comum/lista-direcao.js')
const { lerArvore } = require('../comum/sei.js')
const { lerLista } = require('../comum/lista-assinaturas.js')
const { PADROES } = require('../comum/configuracoes.js')

const P1 = '23236.021417/2026-95'
const P2 = '23236.022730/2026-41'
const item = (processo, documento, comentario = '') => ({ processo, idProcesso: '1', documento, nome: 'Ofício', soCiencia: false, comentario })

const arvore = `
Nos[0] = new infraArvoreNo("PROCESSO","10",null,"x","ifrVisualizacao","${P1}","Tipo","svg/processo.svg",null,null,true,true,null,null,null,"x");
Nos[0].acoes = '<a href="controlador.php?acao=procedimento_atribuicao_cadastrar&id_procedimento=10&arvore=1&infra_hash=abc" tabindex="451" ><img title="Atribuir Processo"/></a>';
Nos[1] = new infraArvoreNo("DOCUMENTO","11","10","y","ifrConteudoVisualizacao","Despacho 163 (3229092)","t","svg/documento_interno.svg",null,null,true,true,null,null,null,"x");
Nos[1].acoes = '<a href="#" onclick="assinarDocumento();"><img alt="Assinar Documento" title="Assinar Documento"/></a>';
Nos[2] = new infraArvoreNo("DOCUMENTO","12","10","y","ifrConteudoVisualizacao","Ateste Fatura Materiais 3375110","t","svg/documento_interno.svg",null,null,true,true,null,null,null,"x");
NosAcoes[0] = new infraArvoreAcao("ABRIR_PASTAS","AP10","10","controlador.php?acao=procedimento_visualizar&abrir_pastas=1",null,"Abrir todas as Pastas","svg/mais.svg",true);
NosAcoes[1] = new infraArvoreAcao("ASSINATURA","A11","11","controlador.php?acao=assinatura_listar","ifrVisualizacao","Assinado por:\\nMaria José da Silva\\nDiretora-Geral\\nPAL/REI/IFTO","svg/assinatura2.svg?25",true);
`

test('árvore: quem pode assinar, assinaturas, atribuir e abrir pastas', () => {
  const lida = lerArvore(arvore)
  assert.equal(lida.documentos[0].podeAssinar, true)
  assert.equal(lida.documentos[1].podeAssinar, false)
  assert.deepEqual(lida.documentos[0].assinaturas, ['Assinado por:', 'Maria José da Silva', 'Diretora-Geral', 'PAL/REI/IFTO'])
  assert.deepEqual(lida.documentos[1].assinaturas, [])
  assert.match(lida.linkAtribuir, /procedimento_atribuicao_cadastrar&id_procedimento=10/)
  assert.match(lida.linkAbrirPastas, /abrir_pastas=1/)
})

test('árvore guardada do SEI (se existir no computador)', t => {
  const caminho = path.join(__dirname, '../ferramentas-de-teste/paginas-sei/SEI - Árvore Montar.html')
  if (!fs.existsSync(caminho)) return t.skip('sem a página guardada')
  const lida = lerArvore(fs.readFileSync(caminho, 'latin1'))
  assert.ok(lida.linkAtribuir && lida.linkAbrirPastas)
  assert.ok(lida.documentos.some(d => r.assinadoPor(d.assinaturas, 'Laecio Vieira dos Santos Junior')))
  assert.ok(lida.documentos.every(d => r.numeroDoDocumento(d.rotulo)))
})

test('número do documento com e sem parênteses', () => {
  assert.equal(r.numeroDoDocumento('Despacho 163 (3229092)'), '3229092')
  assert.equal(r.numeroDoDocumento('Ateste Fatura Materiais 3375110'), '3375110')
  assert.equal(r.numeroDoDocumento('Despacho 163'), '')
})

test('assinado por: só o nome inteiro, sem ligar para acentos e maiúsculas', () => {
  const linhas = ['Assinado por:', 'Maria José da Silva', 'Diretora-Geral']
  assert.equal(r.assinadoPor(linhas, 'MARIA JOSE DA SILVA'), true)
  assert.equal(r.assinadoPor(linhas, 'Maria José'), false)
  assert.equal(r.assinadoPor(linhas, ''), false)
})

test('texto copiado, lido de volta pelo painel da direção, dá os mesmos itens', () => {
  const itens = [
    item(P1, '3384598'), item(P1, '3384645'), item(P1, '3384700', 'urgente'),
    item(P2, '3384800', r.arrumarComentario('', true)),
    item(P2, '3384801', r.arrumarComentario('3384999 já foi')),
    item(P2, '3384802', r.arrumarComentario('a 3384999')),
    item(P2, '3384803', r.arrumarComentario(' - 12345678 e\n outros'))
  ]
  const texto = r.textoParaCopiar(itens)
  assert.equal(texto.split('\n')[0], `${P1} - 3384598, 3384645`)
  const lidos = lerLista(texto)
  assert.deepEqual(lidos.erros, [])
  assert.deepEqual(lidos.itens.map(i => [i.processo, i.documento, i.comentario, i.ate]), itens.map(i => [i.processo, i.documento, i.comentario, undefined]))
  assert.equal(lidos.itens[3].ciencia, true)
})

test('comentário: ciência sempre presente no item só de ciência', () => {
  assert.equal(r.arrumarComentario('', true), 'ciência')
  assert.equal(r.arrumarComentario('ver anexo', true), 'ciência – ver anexo')
  assert.equal(r.arrumarComentario('dar ciencia', true), 'dar ciencia')
  for (const texto of ['3384598 x', 'ver anexo']) {
    const uma = r.arrumarComentario(texto, true)
    assert.equal(r.arrumarComentario(uma, true), uma)
  }
})

test('lista: junta por processo, não repete, remove e muda a ordem', () => {
  let itens = []
  for (const novo of [item(P1, '1000001'), item(P2, '1000002'), item(P1, '1000003'), item(P1, '1000001')]) itens = r.adicionar(itens, novo)
  const numeros = lista => lista.map(i => i.documento).join()
  assert.equal(numeros(itens), '1000001,1000003,1000002')
  assert.equal(numeros(r.moverDocumento(itens, '1000003', -1)), '1000003,1000001,1000002')
  assert.equal(numeros(r.moverDocumento(itens, '1000003', 1)), numeros(itens))
  assert.equal(numeros(r.moverProcesso(itens, P2, -1)), '1000002,1000001,1000003')
  assert.equal(numeros(r.moverProcesso(itens, P2, 1)), numeros(itens))
  assert.equal(numeros(r.remover(itens, '1000001')), '1000003,1000002')
})

test('lista enviada mais recente com o documento', () => {
  const enviadas = [{ em: '2026-11-01T10:00:00Z', itens: [item(P1, '1000001')] }, { em: '2026-11-20T10:00:00Z', itens: [item(P1, '1000001')] }]
  assert.equal(r.enviadaCom(enviadas, '1000001').em, '2026-11-20T10:00:00Z')
  assert.equal(r.enviadaCom(enviadas, '9'), null)
})

test('listas enviadas só são apagadas com a opção ligada e prazo válido', () => {
  const agora = new Date('2026-11-23T12:00:00Z')
  const enviadas = [{ em: '2026-09-01T10:00:00Z' }, { em: '2026-11-20T10:00:00Z' }]
  assert.equal(r.enviadasNoPrazo(enviadas, PADROES, agora).length, 2)
  assert.equal(r.enviadasNoPrazo(enviadas, { direcaoApagar: true, direcaoApagarDias: '60' }, agora).length, 1)
  for (const dias of ['', '0', '-3', 'abc']) assert.equal(r.enviadasNoPrazo(enviadas, { direcaoApagar: true, direcaoApagarDias: dias }, agora).length, 2)
})

test('quem assina: substituto só no período, com a data final contando', () => {
  const o = { direcaoDiretorNome: 'Diretor', direcaoDiretorMatricula: '1', direcaoSubstitutoNome: 'Sub', direcaoSubstitutoMatricula: '2', direcaoSubstitutoInicio: '', direcaoSubstitutoFim: '2026-11-25' }
  assert.equal(r.quemAssina(o, new Date(2026, 10, 25, 23, 50)).nome, 'Sub')
  assert.equal(r.quemAssina(o, new Date(2026, 10, 26)).nome, 'Diretor')
  assert.equal(r.quemAssina({ ...o, direcaoSubstitutoInicio: '2026-11-24' }, new Date(2026, 10, 23)).nome, 'Diretor')
  assert.equal(r.quemAssina({ ...o, direcaoSubstitutoFim: '' }, new Date(2026, 10, 23)).nome, 'Diretor')
  assert.equal(r.quemAssina(PADROES, new Date()), null)
})

test('só a chefia registrada atribui, com a opção ligada', () => {
  const hoje = new Date(2026, 10, 23)
  const o = { ...PADROES, direcaoAtribuir: true, direcaoChefeMatricula: '300', direcaoDiretorMatricula: '1' }
  assert.equal(r.matriculaDoUsuario('Fulano de Tal (300/IFTO)'), '300')
  assert.equal(r.podeAtribuir(o, '300', hoje), true)
  assert.equal(r.podeAtribuir(o, '301', hoje), false)
  assert.equal(r.podeAtribuir({ ...o, direcaoAtribuir: false }, '300', hoje), false)
  assert.equal(r.podeAtribuir({ ...o, direcaoChefeMatricula: '' }, '', hoje), false)
  assert.equal(r.podeAtribuir({ ...o, direcaoDiretorMatricula: '' }, '300', hoje), false)
})

test('atribuição: já está, atribuir, perguntar e fora da lista', () => {
  const lista = atual => r.lerPessoas([
    { valor: 'null', texto: ' ', marcada: false },
    { valor: '100', texto: '1 - Diretor', marcada: atual === 1 },
    { valor: '200', texto: '300 - Chefe', marcada: atual === 300 },
    { valor: '400', texto: '4 - Outra - Pessoa', marcada: atual === 4 }
  ])
  assert.equal(lista(0).length, 3)
  assert.equal(r.decidirAtribuicao(lista(1), '1', '300').acao, 'ja-esta')
  assert.equal(r.decidirAtribuicao(lista(300), '1', '300').acao, 'atribuir')
  assert.equal(r.decidirAtribuicao(lista(0), '1', '300').acao, 'atribuir')
  assert.equal(r.decidirAtribuicao(lista(4), '1', '300').acao, 'perguntar')
  assert.equal(r.decidirAtribuicao(lista(4), '1', '300').atual.nome, 'Outra - Pessoa')
  assert.equal(r.decidirAtribuicao(lista(0), '100', '300').acao, 'nao-esta-na-lista')
})

test('função só na Direção-geral e só ligada', () => {
  assert.equal(r.ligada(PADROES, 'PAL/REI/IFTO'), true)
  assert.equal(r.ligada(PADROES, 'CGOC/GAC/DAP/PAL/REI/IFTO'), false)
  assert.equal(r.ligada({ ...PADROES, listaDirecao: false }, 'PAL/REI/IFTO'), false)
})
