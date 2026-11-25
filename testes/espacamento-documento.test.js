const { test } = require('node:test')
const assert = require('node:assert/strict')
const { MARCA, mesmoEspacamento, seletoresDoBloco, temEspacamento, tirarEspacamento, escapar, seletorDe, acertos, linhasQueFaltam, planejarEspacamento } = require('../comum/espacamento-documento.js')
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
    // v0.33.0: linha em branco salva (duas linhas do estilo "sem espaço", como o separador antes do corpo).
    altura: medidas.altura ?? (texto ? undefined : 32),
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
    'Ao Diretor de Administração', 'Giulliano Guimarães da Silva', 'Quadra 310 Sul…'
  ])
  // Uma linha inteira (16px) entre as letras: 16 - 5 - 2 = 9px = 0,57em antes da caixa do processo.
  assert.equal(plano.lacunas[2].margem, 0.57)
  assert.equal(plano.lacunas[4].margem, 1)
  assert.ok(plano.bloco.startsWith('<style>/* ' + MARCA + ' */'))
  assert.ok(plano.bloco.endsWith('</style>'))
})

test('nada entre linhas da mesma seção, com linha em branco no meio, nem dentro do rodapé', () => {
  const documento = despacho()
  documento.blocos.push(bloco(8, 'Rodapé', 'IFTO_Centralizado_rodape', 'CEP 77021-090'))
  const plano = planejarEspacamento(documento)
  const depois = plano.lacunas.map(lacuna => lacuna.depois)
  assert.ok(!depois.includes('Assim, solicito as providências…'))
  assert.ok(!depois.includes('Em resposta ao processo em epígrafe…'))
  assert.ok(!depois.includes('CEP 77021-090'))
})

// v0.33.0: o documento salvo não tem a seção só com a linha vazia do editor, nem a linha em branco logo depois
// do timbre (Despacho 3392797 e Capa de Processo): timbre e número, "Assunto" e destinatário ficavam grudados.
test('separador que o SEI não salva não conta como espaço; linha em branco salva conta pela altura', () => {
  posicoes = {}
  const timbre = bloco(0, 'Cabeçalho', 'IFTO_Cabeçalho_Novo', 'Coordenação de Gestão Orçamentária e Contratos', { abaixo: 0 })
  const separador = bloco(1, 'Separador de seção', 'IFTO_Alin_direita_sem_espaço', '')
  Object.assign(separador, { altura: 32 })
  const numero = bloco(2, 'Identificador', 'IFTO_padrao_Alin_Esquerda_sem_espaço', 'DESPACHO Nº 67/2026/CGOC/GAC/DAP/PAL/REI/IFTO', { acima: 0 })
  const caixa = bloco(3, 'Info e assunto', '', 'Processo nº: 1', { tag: 'div', textoFim: 'Assunto: x', acima: 8 })
  const vazio = bloco(4, 'Separador de seção2', '', '')
  Object.assign(vazio, { semNada: true, altura: 16 })
  const vocativo = bloco(5, 'Vocativo', 'IFTO_padrao_Alin_Esquerda_sem_espaço', 'Ao Senhor Diretor')
  const linha = bloco(6, 'Separador de seção3', 'IFTO_Alin_direita_sem_espaço', '')
  Object.assign(linha, { altura: 32 })
  const corpo = bloco(7, 'Corpo', 'IFTO_Item_Nvl_1', 'Encaminhamos o processo')
  const documento = { blocos: [timbre, separador, numero, caixa, vazio, vocativo, linha, corpo], outras: [] }
  const plano = planejarEspacamento(documento)
  assert.deepEqual(plano.lacunas.map(lacuna => lacuna.depois), ['DESPACHO Nº 67/2026/CGOC/GAC/DAP/PAL/REI/IFTO', 'Processo nº: 1', 'Ao Senhor Diretor'])
  assert.equal(plano.lacunas[0].margem, 1.5)
  assert.ok(plano.css.includes('p.IFTO_Cabe\\0000e7alho_Novo+p.IFTO_padrao_Alin_Esquerda_sem_espa\\0000e7o{margin-top:1.5em'))
  assert.ok(plano.css.includes('div+p.IFTO_padrao_Alin_Esquerda_sem_espa\\0000e7o{margin-top:'))
  // Linha em branco salva, mas quase sem altura: o espaço vai mesmo assim.
  linha.altura = 3
  assert.ok(planejarEspacamento(documento).lacunas.some(lacuna => lacuna.depois === 'Encaminhamos o processo'))
})

// v0.36.2 (Despacho 3397868): na primeira abertura do documento novo, o separador depois da caixa do processo tem
// uma linha em branco; o SEI a tira ao salvar e o destinatário ficava grudado em "Assunto".
test('Despacho novo: o separador entre "Assunto" e o destinatário não conta como espaço', () => {
  const documento = despacho()
  const separador = { ...documento.blocos[5], raiz: 3.5, secao: 'Separador de seção2', editavel: false, semNada: false }
  documento.blocos.splice(4, 0, separador)
  documento.blocos.find(outro => outro.raiz === 5).editavel = false
  const plano = planejarEspacamento(documento)
  assert.equal(plano.lacunas.find(lacuna => lacuna.depois === 'Ao Diretor de Administração').seletor, 'div+p.IFTO_padrao_Alin_Esquerda_sem_espa\\0000e7o')
  // O separador antes do corpo é salvo: continua contando como espaço.
  assert.ok(!plano.lacunas.some(lacuna => lacuna.depois.startsWith('Em resposta')))
  // Linha em branco que a pessoa pôs numa parte que dá para editar: conta.
  separador.editavel = true
  assert.ok(!planejarEspacamento(documento).lacunas.some(lacuna => lacuna.depois.startsWith('Ao Diretor')))
})

test('Capa de Processo: espaço entre o timbre e "Processo:" (o separador depois do timbre não é salvo)', () => {
  posicoes = {}
  const timbre = bloco(0, 'Cabeçalho', 'IFTO_Cabeçalho_Novo', 'Coordenação de Gestão Orçamentária e Contratos', { abaixo: -7 })
  const separador = bloco(1, 'Separador de seção', 'IFTO_Alin_direita_sem_espaço', '')
  Object.assign(separador, { altura: 32 })
  const corpo = bloco(2, 'Corpo', 'Texto_Justificado', 'Processo: 23236.023277/2026-90', { acima: 2 })
  corpo.margemTopo = 8
  const plano = planejarEspacamento({ blocos: [timbre, separador, corpo], outras: [] })
  assert.deepEqual(plano.lacunas.map(lacuna => lacuna.depois), ['Processo: 23236.023277/2026-90'])
  assert.equal(plano.lacunas[0].margem, 1.82)
})

test('bloco que o documento já tem: igual ao novo (só as regras do documento salvo contam) ou diferente', () => {
  const plano = planejarEspacamento(despacho())
  assert.equal(mesmoEspacamento('<p>' + plano.bloco + '</p>', plano), true)
  const antigo = '<style>/* ' + MARCA + ' */p.IFTO_Alin_direita+div{margin-top:0.5em!important}.ck-editor__editable[aria-label=Data] :nth-child(1){margin-top:1em!important}</style>'
  assert.equal(mesmoEspacamento(antigo, plano), false)
  assert.deepEqual(seletoresDoBloco(antigo), ['p.IFTO_Alin_direita+div'])
})

test('distância de meia linha ou mais não recebe espaço', () => {
  const documento = despacho()
  documento.blocos[2].abaixo = 6
  documento.blocos[3].acima = 2
  const plano = planejarEspacamento(documento)
  assert.ok(!plano.lacunas.some(lacuna => lacuna.depois.startsWith('Processo')))
  // v0.34.2: depois do número do documento, só uma linha inteira basta.
  documento.blocos[1].abaixo = 0
  documento.blocos[2].acima = 8
  assert.ok(planejarEspacamento(documento).lacunas.some(lacuna => lacuna.depois.startsWith('Palmas')))
  documento.blocos[2].acima = 16
  assert.ok(!planejarEspacamento(documento).lacunas.some(lacuna => lacuna.depois.startsWith('Palmas')))
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

// v0.34.2: Notificação 3394735.
test('Notificação: uma linha e meia depois do timbre e uma linha inteira entre o número e "Assunto:"', () => {
  posicoes = {}
  const timbre = bloco(0, 'Cabeçalho', 'IFTO_Cabeçalho_Novo', 'Coordenação de Gestão Orçamentária e Contratos', { abaixo: -8.1 })
  Object.assign(timbre, { margemBaixo: 14.4 })
  const numero = bloco(1, 'Identificador', 'Texto_Centralizado_Maiusculas', 'notificação nº 4/2026/PORT/880/2022/PAL/REI/IFTO, de 23 de novembro de 2026', { acima: 0, abaixo: 0 })
  const assunto = bloco(2, 'Corpo', 'Texto_Justificado', 'Assunto: Resposta', { acima: 0, abaixo: 0 })
  Object.assign(assunto, { margemTopo: 8, margemBaixo: 8 })
  const notificada = bloco(2, 'Corpo', 'Texto_Justificado', 'Notificada: X', { acima: 0, abaixo: 0 })
  Object.assign(notificada, { margemTopo: 8, margemBaixo: 8 })
  const plano = planejarEspacamento({ blocos: [timbre, numero, assunto, notificada], outras: [] })
  assert.deepEqual(plano.lacunas.map(lacuna => [lacuna.seletor, lacuna.margem]), [
    ['p.IFTO_Cabe\\0000e7alho_Novo+p.Texto_Centralizado_Maiusculas', 2.01],
    ['p.Texto_Centralizado_Maiusculas+p.Texto_Justificado', 1]
  ])
  // Mesmas partes com o espaço menor: o bloco é trocado; diferença de arredondamento, não.
  assert.equal(mesmoEspacamento(plano.bloco, plano), true)
  assert.equal(mesmoEspacamento(plano.bloco.replace('2.01em', '1.52em'), plano), false)
  assert.equal(mesmoEspacamento(plano.bloco.replace('2.01em', '2.05em'), plano), true)
})

// v0.35.3: Solicitação de nota de empenho 3396459.
function solicitacao (semLinhas) {
  posicoes = {}
  const vazia = () => semLinhas ? [] : [bloco(2, 'Nome', 'IFTO_Assinatura', '', { altura: 1.6 })]
  return [
    bloco(0, 'Corpo', 'Texto_Justificado', 'Ordenador de Despesas: NOEMI'),
    bloco(1, 'Data', 'IFTO_Alin_direita_sem_espaço', 'Palmas, 24 de novembro de 2026.'),
    ...vazia(),
    bloco(2, 'Nome', 'IFTO_Assinatura', 'SILBERTO', { acima: -8 }),
    bloco(2, 'Nome', 'IFTO_Assinatura', 'Diretor', { acima: -8, abaixo: -8 }),
    ...vazia(),
    bloco(3, 'Rodapé', 'IFTO_Centralizado_rodape', 'Quadra 310 Sul')
  ]
}
test('espaço também quando o SEI põe uma caixa entre as partes do documento salvo', () => {
  const { css } = planejarEspacamento({ blocos: solicitacao(true), outras: [] })
  assert.match(css, /p\.Texto_Justificado\+div\+p\.IFTO_Alin_direita_sem_espa\\0000e7o\{margin-top/)
  assert.match(css, /p\.IFTO_Assinatura\+div p\.IFTO_Centralizado_rodape\{margin-top/)
})
test('linha em branco antes e depois de quem assina: só onde não há nenhuma', () => {
  const faltam = linhasQueFaltam({ blocos: solicitacao(true) })
  assert.deepEqual(faltam.map(f => [f.raiz, f.posicao, f.onde, f.antes, f.depois]), [
    [2, 1, 'antes', 'Palmas, 24 de novembro de 2026.', 'SILBERTO'],
    [2, 2, 'depois', 'Diretor', 'Quadra 310 Sul']
  ])
  assert.deepEqual(linhasQueFaltam({ blocos: solicitacao(false) }), [])
  assert.deepEqual(linhasQueFaltam({ blocos: solicitacao(true).map(b => ({ ...b, editavel: false })) }), [])
  assert.deepEqual(linhasQueFaltam(null), [])
})

// v0.36.1: no Despacho o que vem antes de quem assina é o texto, não a data.
test('linha em branco antes de quem assina, venha o que vier antes', () => {
  const montar = (antes, depois, classe = 'IFTO_Assinatura') => {
    posicoes = {}
    const vazia = raiz => bloco(raiz, 'x', classe, '', { altura: 1.6 })
    return [
      bloco(0, 'Data', 'IFTO_Alin_direita', 'Palmas, 24 de novembro de 2026.'),
      bloco(1, 'Corpo', 'IFTO_padrao_Alin_Justificado', 'Encaminho o processo.', { abaixo: 8 }),
      ...(antes ? [vazia(2)] : []),
      bloco(2, 'Identificação', classe, 'FULANO'), bloco(2, 'Identificação', classe, 'Diretor'),
      ...(depois ? [vazia(2)] : []),
      bloco(3, 'Rodapé', 'IFTO_Centralizado_rodape', 'Quadra 310 Sul')
    ]
  }
  const onde = blocos => linhasQueFaltam({ blocos }).map(f => [f.onde, f.posicao])
  for (const classe of ['IFTO_Assinatura', 'IFTO_Centralizado']) {
    assert.deepEqual(onde(montar(false, false, classe)), [['antes', 1], ['depois', 2]])
    assert.deepEqual(onde(montar(false, true, classe)), [['antes', 1]])
    assert.deepEqual(onde(montar(true, false, classe)), [['depois', 3]])
    assert.deepEqual(onde(montar(true, true, classe)), [])
  }
  // Duas pessoas separadas por linha em branco: só falta a de cima da primeira.
  const dupla = montar(false, true)
  dupla.splice(4, 0, bloco(2, 'x', 'IFTO_Assinatura', 'Cargo 1'), bloco(2, 'x', 'IFTO_Assinatura', ''), bloco(2, 'x', 'IFTO_Assinatura', 'BELTRANO'))
  assert.deepEqual(onde(dupla), [['antes', 1]])
})
