const { test } = require('node:test')
const assert = require('node:assert/strict')
const c = require('../comum/conferir-documento.js')

test('v0.26.0: sigla limpa e unidade do Campus Palmas', () => {
  assert.equal(c.siglaDaUnidade(' cgoc / pal/rei/ifto '), 'CGOC/PAL/REI/IFTO')
  assert.equal(c.ehUnidadePalmas('CGOC/PAL/REI/IFTO'), true)
  assert.equal(c.ehUnidadePalmas('PAL/REI/IFTO'), true)
  assert.equal(c.ehUnidadePalmas('DIAP/REI/IFTO'), false)
  assert.equal(c.ehUnidadePalmas('ARA/REI/IFTO'), false)
})

test('v0.26.0: unidade guardada sem linhas vazias, sem siglas repetidas', () => {
  assert.deepEqual(c.limparUnidade({ sigla: 'cgoc/pal/rei/ifto', telefone: ' 63 3236-4035 ', email: 'CGOC.Palmas@ifto.edu.br', linhas: 'Diretoria\n\n  Coordenação  X \n' }),
    { sigla: 'CGOC/PAL/REI/IFTO', telefone: '63 3236-4035', email: 'cgoc.palmas@ifto.edu.br', linhas: ['Diretoria', 'Coordenação X'] })
  const lista = c.limparUnidades([{ sigla: 'A/PAL/REI/IFTO', telefone: '1' }, { sigla: '' }, { sigla: 'a/pal/rei/ifto', telefone: '2' }])
  assert.equal(lista.length, 1)
  assert.equal(lista[0].telefone, '2')
  assert.equal(c.acharUnidade(lista, 'A/PAL/REI/IFTO').telefone, '2')
  assert.equal(c.acharUnidade(lista, 'B/PAL/REI/IFTO'), null)
  assert.deepEqual(c.limparUnidades(undefined), [])
})

// v0.26.2: trechos como o SEI os guarda (Despacho 67/2026/CGOC e Minuta 3384558, páginas salvas).
const timbre = '<p class="IFTO_Timbre">Ministério da Educação</p><p class="IFTO_padrao_Alin_Esquerda_sem_espa&ccedil;o">DESPACHO N&ordm;&nbsp;67/2026/CGOC</p>'
const linha = num => '<div><p class="IFTO_padrao_Alin_Esquerda_sem_espa&ccedil;o">Processo n&ordm;: <b>' + num + '</b></p><p>Interessado: <b>X</b></p></div>'
const referencia = num => '<table><tbody><tr><td><strong>Refer&ecirc;ncia:</strong> Processo n&ordm; ' + num + '</td><td>SEI nº 3384977</td></tr></tbody></table>'
const secoes = (num, ref) => [{ nome: 's1', html: timbre, editavel: false }, { nome: 's2', html: linha(num), editavel: true }, { nome: 's3', html: '<p>Cita o processo nº 99999.999999/2020-99.</p>', editavel: true }, { nome: 's4', html: referencia(ref), editavel: false }]

test('v0.26.2: texto do HTML sem tags, entidades e caracteres invisíveis', () => {
  assert.equal(c.textoDoHtml('<p>Processo n&ordm;:&nbsp;<b>1</b>​</p>'), 'Processo nº: 1')
  assert.equal(c.textoDoHtml('Refer&ecirc;ncia &Ccedil;&atilde;o'), 'Referência Ção')
})

test('v0.26.2: número do processo certo e errado', () => {
  assert.deepEqual(c.conferirProcesso(secoes('23236.018761/2026-05', '23236.018761/2026-05')), { certo: true, processo: '23236.018761/2026-05', escrito: '23236.018761/2026-05', secao: 's2', editavel: true, link: false })
  const errado = c.conferirProcesso(secoes('23236.000001/2025-11', '23236.018761/2026-05'))
  assert.equal(errado.certo, false)
  assert.equal(c.avisoDoProcesso(errado), 'O documento está no processo 23236.018761/2026-05, mas o texto diz 23236.000001/2025-11.')
  // só dígitos contam
  assert.equal(c.conferirProcesso(secoes('23236018761202605', '23236.018761/2026-05')).certo, true)
})

test('v0.26.2: sem a linha (Ofício) ou sem a referência não há o que conferir; o corpo não conta', () => {
  assert.equal(c.conferirProcesso([{ nome: 'a', html: timbre }, { nome: 'b', html: '<p>Senhor Diretor, o processo nº 23236.000001/2025-11…</p>' + referencia('23236.018761/2026-05') }]), null)
  assert.equal(c.conferirProcesso([{ nome: 'a', html: linha('23236.000001/2025-11') }]), null)
  const muitos = '<p>linha</p>'.repeat(25)
  assert.equal(c.conferirProcesso([{ nome: 'a', html: muitos + linha('23236.000001/2025-11') + referencia('23236.018761/2026-05') }]), null)
})

test('v0.26.2: título do Edital com o processo em link do SEI (só aviso, D17)', () => {
  const titulo = '<p class="IFTO_Centralizado_Negrito_Maiusculo"><strong>(Processo Administrativo n&deg;&nbsp;</strong><a class="ancora_sei ck-widget" id="lnkSei3365963">23236.023680/2023-76</a><strong>)</strong></p>'
  const r = c.conferirProcesso([{ nome: 'a', html: titulo, editavel: true }, { nome: 'b', html: referencia('23236.005567/2026-51') }])
  assert.equal(r.certo, false)
  assert.equal(r.link, true)
  assert.equal(r.escrito, '23236.023680/2023-76')
})

test('v0.26.2: corrigir troca só o número da linha "Processo nº:"', () => {
  const html = linha('23236.000001/2025-11') + '<p>Outro 23236.000001/2025-11</p>'
  assert.equal(c.corrigirProcesso(html, '23236018761202605'), linha('23236.018761/2026-05') + '<p>Outro 23236.000001/2025-11</p>')
  assert.equal(c.corrigirProcesso('<p>Sem linha</p>', '23236018761202605'), null)
})

test('v0.26.2: documento assinado', () => {
  assert.equal(c.estaAssinado('<p>Documento assinado eletronicamente por <b>Fulano</b></p>'), true)
  assert.equal(c.estaAssinado(linha('1')), false)
})

test('v0.26.3: pergunta antes de assinar com os dois números', () => {
  assert.equal(c.perguntaAntesDeAssinar({ processo: '23236.018761/2026-05', escrito: '23236.000001/2025-11' }),
    'O número do processo está errado (documento no processo 23236.018761/2026-05, texto diz 23236.000001/2025-11). Assinar mesmo assim?')
})

test('v0.26.4: número SEI do documento e "Assinar mesmo assim" só no dia', () => {
  assert.equal(c.numeroSeiDoDocumento(referencia('23236.018761/2026-05')), '3384977')
  assert.equal(c.numeroSeiDoDocumento('<p>nada</p>'), '')
  const hoje = new Date(2026, 10, 18)
  const guardado = c.aceitar(c.aceitar(null, ['1'], hoje), ['2', '1'], hoje)
  assert.deepEqual(guardado, { dia: '2026-11-18', numeros: ['1', '2'] })
  assert.equal(c.foiAceito(guardado, '2', hoje), true)
  assert.equal(c.foiAceito(guardado, '3', hoje), false)
  assert.equal(c.foiAceito(guardado, '2', new Date(2026, 10, 19)), false)
  assert.deepEqual(c.aceitar(guardado, ['9'], new Date(2026, 10, 19)).numeros, ['9'])
})
