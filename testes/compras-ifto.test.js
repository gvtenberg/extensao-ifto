const { test } = require('node:test')
const assert = require('node:assert/strict')
const c = require('../comum/compras-ifto.js')

const mensagem = peca => ({ origem: 'compras-ifto', tipo: 'enviar-ao-sei', peca })

test('Compras IFTO: só o endereço do Render conta (D10)', () => {
  assert.equal(c.ehDoCompras('https://compras-ifto-teste-v1-mbro.onrender.com/#/processo/p1/tr'), true)
  assert.equal(c.ehDoCompras('https://compras-ifto-teste-v1-mbro.onrender.com.exemplo.com/'), false)
  assert.equal(c.ehDoCompras('http://localhost:3000/'), false)
  assert.equal(c.ehDoCompras('não é endereço'), false)
})

test('Compras IFTO: automática só na CCL (D7)', () => {
  assert.equal(c.funcaoLigada('automatica', ' ccl/gac/dap/pal/rei/ifto '), true)
  assert.equal(c.funcaoLigada('automatica', 'CGOC/GAC/DAP/PAL/REI/IFTO'), false)
  assert.equal(c.funcaoLigada('sempre', 'CGOC/GAC/DAP/PAL/REI/IFTO'), true)
  assert.equal(c.funcaoLigada('desligada', 'CCL/GAC/DAP/PAL/REI/IFTO'), false)
})

test('Compras IFTO: mensagem da página conferida, só com os campos esperados', () => {
  const { peca } = c.lerPeca(mensagem({ id: 'p1:tr', titulo: ' TERMO DE REFERÊNCIA ', fase: 'Termo de Referência', nup: '23236.000101/2026-11', html: '<p>Texto</p>', extra: 'x' }))
  assert.equal(peca.titulo, 'TERMO DE REFERÊNCIA')
  assert.equal(peca.nup, '23236.000101/2026-11')
  assert.equal('extra' in peca, false)
  assert.ok(c.lerPeca({ origem: 'outro', tipo: 'enviar-ao-sei', peca: {} }).erro)
  assert.ok(c.lerPeca(mensagem({ titulo: 'TR', html: '  ' })).erro)
  assert.ok(c.lerPeca(mensagem({ titulo: '', html: '<p>x</p>' })).erro)
  assert.ok(c.lerPeca(mensagem({ titulo: 'TR', html: 'x'.repeat(c.MAXIMO_HTML + 1) })).erro)
  assert.ok(c.lerPeca(null).erro)
})

test('Compras IFTO: lista de peças troca a mesma peça e guarda no máximo 20 (D8)', () => {
  let lista = c.juntarPeca([], { id: 'p1:tr', html: 'velho' }, 1)
  lista = c.juntarPeca(lista, { id: 'p1:etp', html: 'etp' }, 2)
  lista = c.juntarPeca(lista, { id: 'p1:tr', html: 'novo' }, 3)
  assert.deepEqual(lista.map(item => [item.id, item.html]), [['p1:tr', 'novo'], ['p1:etp', 'etp']])
  assert.deepEqual(c.tirarPeca(lista, 'p1:tr').map(item => item.id), ['p1:etp'])
  for (let i = 0; i < 30; i++) lista = c.juntarPeca(lista, { id: 'x' + i }, i)
  assert.equal(lista.length, c.MAXIMO_PECAS)
})

test('Compras IFTO: sugere o tipo do SEI pelo nome da fase ou o título (D4)', () => {
  const tipos = [
    { id: '1', nome: 'Termo' },
    { id: '2', nome: 'Termo de Referência' },
    { id: '3', nome: 'Estudo Técnico Preliminar - ETP' },
    { id: '4', nome: 'Documento de Formalização de Demanda' },
    { id: '5', nome: 'Nota Técnica' },
    { id: '6', nome: 'Declaração' }
  ]
  assert.equal(c.sugerirTipo(tipos, ['Termo de Referência', 'TERMO DE REFERÊNCIA']).id, '2')
  assert.equal(c.sugerirTipo(tipos, ['ETP', 'ESTUDO TÉCNICO PRELIMINAR']).id, '3')
  assert.equal(c.sugerirTipo(tipos, ['DFD', 'DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA']).id, '4')
  assert.equal(c.sugerirTipo(tipos, ['Pesquisa de preços', 'NOTA TÉCNICA – ANÁLISE CRÍTICA DA PESQUISA DE PREÇOS']).id, '5')
  assert.equal(c.sugerirTipo(tipos, ['Mapa de riscos']), null)
})

test('Compras IFTO: lê os tipos da página Incluir Documento, sem o externo', () => {
  const html = `<a href="#" onclick="escolher(-1)" class="ancoraOpcao">Externo</a>
    <a href="#" onclick="escolher(120)" class="ancoraOpcao">Termo de Refer&ecirc;ncia</a>
    <a href="#" onclick="escolher(45)" class="ancoraOpcao"> <span>Despacho</span> </a>
    <a href="#" onclick="escolher(45)">Despacho</a>`
  assert.deepEqual(c.lerTipos(html), [{ id: '45', nome: 'Despacho' }, { id: '120', nome: 'Termo de Referência' }])
})

test('Compras IFTO: compara o NUP só pelos dígitos (D5)', () => {
  assert.equal(c.compararNup('23236.000101/2026-11', '23236.000101/2026-11'), 'igual')
  assert.equal(c.compararNup('23236000101202611', '23236.000101/2026-11'), 'igual')
  assert.equal(c.compararNup('23236.000188/2026-40', '23236.000101/2026-11'), 'diferente')
  assert.equal(c.compararNup('', '23236.000101/2026-11'), 'sem')
})

test('Compras IFTO: documento do mesmo tipo na árvore ou criado hoje (D9)', () => {
  const tipo = { id: '2', nome: 'Termo de Referência' }
  const documentos = [{ rotulo: 'Termo de Referência 1234567' }, { rotulo: 'Termo de Referencia - Anexo 7654321' }, { rotulo: 'Despacho 111' }]
  const criados = [{ idProcesso: '9', idTipo: '2', data: '16/11/2026' }, { idProcesso: '8', idTipo: '2', data: '16/11/2026' }]
  assert.deepEqual(c.repetidos({ documentos, criados, idProcesso: '9', tipo, hoje: '16/11/2026' }), { naArvore: 2, hojeAqui: 1 })
  assert.deepEqual(c.repetidos({ documentos: [], criados, idProcesso: '9', tipo, hoje: '17/11/2026' }), { naArvore: 0, hojeAqui: 0 })
  assert.deepEqual(c.lembrarCriado(criados.concat({ idProcesso: '1', idTipo: '1', data: '15/11/2026' }), { idProcesso: '9', idTipo: '5', data: '16/11/2026' }).length, 3)
})

test('Compras IFTO: estilos e atributos permitidos no HTML que vai para o SEI', () => {
  assert.equal(c.filtrarEstilo('text-align:justify; text-indent:1.5cm; position:fixed; background-color:#ff0'), 'text-align:justify;text-indent:1.5cm;background-color:#ff0')
  assert.equal(c.filtrarEstilo('color: url(javascript:x)'), '')
  assert.equal(c.atributoPermitido('p', 'onclick', 'x()'), null)
  assert.equal(c.atributoPermitido('a', 'href', 'javascript:alert(1)'), null)
  assert.equal(c.atributoPermitido('a', 'href', 'https://www.gov.br'), 'https://www.gov.br')
  assert.equal(c.atributoPermitido('p', 'class', 'Texto_Justificado'), 'Texto_Justificado')
})

test('Compras IFTO: limpa o HTML (sem script nem evento), mantendo texto e estilos do SEI', () => {
  // Documento mínimo no formato do DOMParser (só o que limparHtml usa).
  const el = (tagName, attributes, childNodes) => ({ nodeType: 1, tagName, attributes, childNodes })
  const tx = nodeValue => ({ nodeType: 3, nodeValue })
  const documento = { body: { childNodes: [
    el('P', [{ name: 'class', value: 'Texto_Justificado' }, { name: 'onclick', value: 'x()' }], [tx('A < B & C')]),
    el('SCRIPT', [], [tx('alert(1)')]),
    el('DIV', [], [el('STRONG', [], [tx('negrito')]), el('BR', [], [])]),
    el('IMG', [{ name: 'src', value: 'x' }, { name: 'onerror', value: 'alert(1)' }], [])
  ] } }
  assert.equal(c.limparHtml(documento), '<p class="Texto_Justificado">A &lt; B &amp; C</p><strong>negrito</strong><br>')
})

test('Compras IFTO: confere o começo do texto salvo sem ligar para espaços e acentos', () => {
  const trecho = c.trechoParaConferir('TERMO DE REFERÊNCIA\n1. Das condições gerais da contratação')
  assert.equal(c.contemTrecho('<p>Termo de Referencia</p> 1.  Das condicoes gerais da contratacao', trecho), true)
  assert.equal(c.contemTrecho('<p>TERMO DE REFER&Ecirc;NCIA</p><p>1. Das condi&ccedil;&otilde;es gerais da contrata&#231;&atilde;o</p>', trecho), true)
  assert.equal(c.contemTrecho('Outro texto', trecho), false)
  assert.equal(c.contemTrecho('qualquer', ''), true)
})

test('lerArvore guarda a página de cada documento na árvore (v0.20.0, para achar o editor)', () => {
  const { lerArvore } = require('../comum/sei.js')
  const texto = 'Nos[0] = new infraArvoreNo("PROCESSO","9",null,"controlador.php?acao=arvore_visualizar","ifrVisualizacao","23236.000101/2026-11","Gestão","svg/processo.svg",null);\n' +
    'Nos[1] = new infraArvoreNo("DOCUMENTO","77","9","controlador.php?acao=arvore_visualizar&amp;id_documento=77&amp;infra_hash=ab","ifrVisualizacao","Termo de Referência 1234567","Termo","svg/documento_interno.svg",null);\n'
  const lida = lerArvore(texto)
  assert.equal(lida.documentos[0].linkArvore, 'controlador.php?acao=arvore_visualizar&id_documento=77&infra_hash=ab')
  assert.equal(lida.documentos[0].feitoNoSei, true)
})

test('Compras IFTO: acha o editor e o texto do documento criado na resposta do SEI (v0.20.0)', () => {
  const html = `<script>janela = window.open('controlador.php?acao=editor_montar&acao_origem=documento_gerar&id_procedimento=9&id_documento=4321&infra_sistema=100000100&infra_hash=abc123','editor');</script>
    <iframe src="controlador.php?acao=documento_visualizar&amp;id_documento=4321&amp;infra_hash=def"></iframe>`
  assert.deepEqual(c.linksDoDocumento(html, 'https://sei.ifto.edu.br/sei/controlador.php?acao=arvore_visualizar'), {
    urlEditor: 'controlador.php?acao=editor_montar&acao_origem=documento_gerar&id_procedimento=9&id_documento=4321&infra_sistema=100000100&infra_hash=abc123',
    linkVer: 'controlador.php?acao=documento_visualizar&id_documento=4321&infra_hash=def',
    idDocumento: '4321'
  })
  assert.deepEqual(c.linksDoDocumento('<p>nada</p>', 'x?acao=arvore_visualizar&id_documento=55'), { urlEditor: '', linkVer: '', idDocumento: '55' })
})
