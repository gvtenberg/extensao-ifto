const { test } = require('node:test')
const assert = require('node:assert/strict')
const { MARCA, temEspacamento, tirarEspacamento, escapar, seletorDe, acertos, planejarEspacamento } = require('../comum/espacamento-documento.js')
const { ehLinhaDaData, conferirData } = require('../comum/data-documento.js')

// Bloco medido (px, letra de 16px). "grudado": distância de quase nada até a linha de cima.
let posicoes = {}
function bloco (raiz, secao, classe, texto, medidas = {}) {
  posicoes[raiz] = (posicoes[raiz] || 0) + 1
  const tag = medidas.tag || 'p'
  return {
    tag,
    classes: classe ? [classe] : [],
    raiz,
    secao,
    posicao: posicoes[raiz],
    vazio: !texto,
    outro: false,
    texto,
    textoFim: medidas.textoFim || texto,
    acima: medidas.acima ?? 2,
    abaixo: medidas.abaixo ?? 2,
    margemTopo: 0,
    margemBaixo: 0,
    fonte: 16,
    fonteDoBloco: 16
  }
}

// Despacho como o 3390347: timbre, número, data, caixa "Processo/Interessado/Assunto", destinatário, linha em
// branco, corpo, assinatura e rodapé (cada parte numa seção do editor).
function despacho () {
  posicoes = {}
  return {
    blocos: [
      bloco(0, 'Cabeçalho', 'IFTO_Cabeçalho_Novo', 'Campus Palmas', { abaixo: -6 }),
      bloco(1, 'Identificador', 'IFTO_padrao_Alin_Esquerda_sem_espaço', 'DESPACHO Nº 367/2026/DEPPI/PAL/REI/IFTO'),
      bloco(2, 'Data', 'IFTO_Alin_direita', 'Palmas, 17 de novembro de 2026.', { acima: 5, abaixo: 5 }),
      bloco(3, 'Info e assunto', '', 'Processo nº: 23236.023147/2026-57', { tag: 'div', textoFim: 'Assunto: Visita' }),
      bloco(4, 'Vocativo', 'IFTO_padrao_Alin_Esquerda_sem_espaço', 'Ao Diretor de Administração'),
      bloco(5, 'Separador de seção', 'IFTO_Alin_direita_sem_espaço', ''),
      bloco(6, 'Corpo', 'IFTO_padrao_Alin_Justificado', 'Em resposta ao processo em epígrafe…', { abaixo: 6 }),
      bloco(6, 'Corpo', 'IFTO_padrao_Alin_Justificado', 'Assim, solicito as providências…', { abaixo: 6 }),
      bloco(7, 'Identificação', 'IFTO_Assinatura', 'Giulliano Guimarães da Silva', { acima: -6 }),
      bloco(8, 'Rodapé', 'IFTO_Centralizado_rodape', 'Quadra 310 Sul…')
    ],
    outras: [[{ tag: 'p', classes: ['IFTO_padrao_Alin_Esquerda_sem_espaço'] }, { tag: 'p', classes: ['IFTO_padrao_Alin_Esquerda_sem_espaço'] }, { tag: 'p', classes: ['IFTO_padrao_Alin_Esquerda_sem_espaço'] }]]
  }
}

test('Despacho: espaço depois do timbre, do número, da data, do "Processo" e antes de quem assina', () => {
  const plano = planejarEspacamento(despacho())
  assert.deepEqual(plano.lacunas.map(lacuna => lacuna.depois), [
    'DESPACHO Nº 367/2026/DEPPI/PAL/REI/IFTO', 'Palmas, 17 de novembro de 2026.', 'Processo nº: 23236.023147/2026-57',
    'Ao Diretor de Administração', 'Giulliano Guimarães da Silva'
  ])
  // Uma linha inteira (16px) entre as letras: 16 - 5 - 2 = 9px = 0,57em antes da caixa do processo.
  assert.equal(plano.lacunas[2].margem, 0.57)
  assert.equal(plano.lacunas[4].margem, 1)
  assert.ok(plano.bloco.startsWith('<style>/* ' + MARCA + ' */'))
  assert.ok(plano.bloco.endsWith('</style>'))
})

test('nada entre linhas da mesma seção, com linha em branco no meio, nem no rodapé', () => {
  const plano = planejarEspacamento(despacho())
  const depois = plano.lacunas.map(lacuna => lacuna.depois)
  assert.ok(!depois.includes('Assim, solicito as providências…'))
  assert.ok(!depois.includes('Em resposta ao processo em epígrafe…'))
  assert.ok(!depois.includes('Quadra 310 Sul…'))
})

test('distância de meia linha ou mais não recebe espaço', () => {
  const documento = despacho()
  documento.blocos[2].acima = 8
  documento.blocos[1].abaixo = 0
  documento.blocos[2].abaixo = 6
  documento.blocos[3].acima = 2
  const plano = planejarEspacamento(documento)
  assert.ok(!plano.lacunas.some(lacuna => lacuna.depois.startsWith('Palmas')))
})

test('seletor do documento salvo: classes sem acento, sem aspas nem ">"', () => {
  const plano = planejarEspacamento(despacho())
  const data = plano.lacunas[1]
  assert.equal(data.seletor, 'p.IFTO_padrao_Alin_Esquerda_sem_espa\\0000e7o+p.IFTO_Alin_direita')
  assert.equal(plano.lacunas[2].seletor, 'p.IFTO_Alin_direita+div')
  assert.doesNotMatch(plano.css, /["'>]/)
  assert.doesNotMatch(plano.css, /[^\x20-\x7e]/)
  assert.ok(plano.css.includes(data.seletor + '{margin-top:' + data.margem + 'em!important}'))
  // No editor: pelo nome da seção e pela posição do bloco nela.
  assert.ok(plano.css.includes('.ck-editor__editable[aria-label=Data] :nth-child(1):not([aria-label=Data] * *){margin-top:'))
})

test('o seletor não pode acertar em outro lugar: usa mais um bloco antes ou deixa a lacuna como está', () => {
  // Destinatário depois da caixa do processo: "div+p.Esquerda". Outra caixa seguida de "p.Esquerda" no corpo.
  const documento = despacho()
  const extra = bloco(6, 'Corpo', '', 'Tabela', { tag: 'div' })
  const depois = bloco(6, 'Corpo', 'IFTO_padrao_Alin_Esquerda_sem_espaço', 'Linha do corpo')
  documento.blocos.splice(7, 0, extra, depois)
  const plano = planejarEspacamento(documento)
  const vocativo = plano.lacunas.find(lacuna => lacuna.depois === 'Ao Diretor de Administração')
  assert.equal(vocativo.seletor, 'p.IFTO_Alin_direita+div+p.IFTO_padrao_Alin_Esquerda_sem_espa\\0000e7o')
  assert.deepEqual(acertos([{ tag: 'div', classes: [] }, { tag: 'p', classes: ['IFTO_padrao_Alin_Esquerda_sem_espaço'] }], documento.blocos), [4, 8])
})

test('seletor que acerta dentro de uma caixa (tabela, lista) não é usado', () => {
  const documento = despacho()
  documento.outras.push([{ tag: 'p', classes: ['IFTO_padrao_Justificado'] }, { tag: 'p', classes: ['IFTO_Assinatura'] }])
  documento.blocos[7].classes = ['IFTO_padrao_Justificado']
  const plano = planejarEspacamento(documento)
  const nome = plano.lacunas.find(lacuna => lacuna.depois === 'Giulliano Guimarães da Silva')
  assert.equal(nome.seletor, 'p.IFTO_padrao_Alin_Justificado+p.IFTO_padrao_Justificado+p.IFTO_Assinatura')
})

test('Ateste: corpo, data e nome de quem assina na mesma seção também ganham espaço (D21)', () => {
  posicoes = {}
  const documento = {
    blocos: [
      bloco(0, 'Corpo do Texto', 'Texto_Justificado', 'Atesto, para os devidos fins…'),
      bloco(0, 'Corpo do Texto', 'Texto_Justificado', 'Obs.: o material…'),
      bloco(0, 'Corpo do Texto', 'IFTO_Alin_direita_sem_espaço', 'Palmas, 12 de novembro de 2026.'),
      bloco(0, 'Corpo do Texto', 'IFTO_Assinatura', 'LAECIO', { acima: -6 }),
      bloco(0, 'Corpo do Texto', 'IFTO_Assinatura', 'Gerente de Infraestrutura e Serviços', { acima: -6 })
    ],
    outras: []
  }
  const plano = planejarEspacamento(documento)
  assert.deepEqual(plano.lacunas.map(lacuna => lacuna.depois), ['Palmas, 12 de novembro de 2026.', 'LAECIO'])
  assert.equal(plano.lacunas[1].seletor, 'p.IFTO_Alin_direita_sem_espa\\0000e7o+p.IFTO_Assinatura')
})

test('blocos que não são parágrafos (tabela) e documento sem lacunas: nada a fazer', () => {
  posicoes = {}
  const tabela = { ...bloco(1, 'Corpo', '', 'x', { tag: 'figure' }), outro: true }
  const plano = planejarEspacamento({ blocos: [bloco(0, 'Cabeçalho', 'IFTO_Cabeçalho_Novo', 'Campus Palmas'), tabela], outras: [] })
  assert.deepEqual(plano, { lacunas: [], css: '', bloco: '' })
  assert.deepEqual(planejarEspacamento(null).lacunas, [])
})

test('reconhece e tira o bloco ("Desfazer"), sem mexer nos outros blocos de estilo', () => {
  const plano = planejarEspacamento(despacho())
  const numeracao = '<style>/* extensao-ifto: numeracao do edital */.x{}</style>'
  const html = '<p class="IFTO_Cabeçalho_">' + plano.bloco + numeracao + '<img src="a.png"></p><p>Texto</p>'
  assert.equal(temEspacamento(html), true)
  assert.equal(tirarEspacamento(html), '<p class="IFTO_Cabeçalho_">' + numeracao + '<img src="a.png"></p><p>Texto</p>')
  assert.equal(temEspacamento(tirarEspacamento(html)), false)
  assert.equal(temEspacamento('<p>Texto</p>'), false)
})

test('escapar e seletorDe', () => {
  assert.equal(escapar('IFTO_Cabeçalho_Novo'), 'IFTO_Cabe\\0000e7alho_Novo')
  assert.equal(escapar('Info e assunto'), 'Info\\000020e\\000020assunto')
  assert.equal(escapar('2a'), '\\000032a')
  assert.equal(seletorDe({ tag: 'div', classes: [] }), 'div')
  assert.equal(seletorDe({ tag: 'div', classes: ['ck-widget'] }), null)
  assert.equal(seletorDe({ tag: 'figure', classes: [] }), null)
})

test('linha da data e o bloco de estilo não atrapalham a conferência da data', () => {
  assert.equal(ehLinhaDaData('Palmas, 17 de novembro de 2026.'), true)
  assert.equal(ehLinhaDaData('Conforme a Portaria de 17 de novembro de 2026, solicito'), false)
  const plano = planejarEspacamento(despacho())
  const titulo = '<p>' + plano.bloco + 'PORTARIA Nº 12/2026/PAL/REI/IFTO, DE 18 DE NOVEMBRO DE 2026</p>'
  assert.equal(conferirData([{ nome: 'a', html: titulo }], new Date(2026, 10, 18)).certo, true)
})
