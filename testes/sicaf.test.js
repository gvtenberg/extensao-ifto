const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const sicaf = require('../comum/sicaf.js')
const { lerArvore } = require('../comum/sei.js')
const PASTA = path.join(__dirname, '../ferramentas-de-teste')

// v0.10.0: etapa 1 do SICAF automático.
test('CNPJ: dígitos verificadores, formato e IFTO', () => {
  assert.equal(sicaf.cnpjValido('14.159.957/0006-02'), true)
  assert.equal(sicaf.cnpjValido('14159957000602'), true)
  assert.equal(sicaf.cnpjValido('14.159.957/0006-03'), false)
  assert.equal(sicaf.cnpjValido('11111111111111'), false)
  assert.equal(sicaf.cnpjValido('1415995700060'), false)
  assert.equal(sicaf.formatarCnpj('10742006000350'), '10.742.006/0003-50')
  assert.equal(sicaf.ehDoIfto('10.742.006/0001-98'), true)
  assert.equal(sicaf.ehDoIfto('14.159.957/0006-02'), false)
})

test('acharCnpjs: só formatados e válidos, na ordem, sem repetir', () => {
  const texto = 'Emitente 31.302.907/0001-39 tomador 10.742.006/0003-50 de novo 31.302.907/0001-39 errado 31.302.907/0001-38 chave 53261031302907000139550010000000631158625875'
  assert.deepEqual(sicaf.acharCnpjs(texto), ['31302907000139', '10742006000350'])
})

test('funcaoLigada: automática só na CGOC', () => {
  assert.equal(sicaf.funcaoLigada('automatica', 'CGOC/GAC/DAP/PAL/REI/IFTO'), true)
  assert.equal(sicaf.funcaoLigada('automatica', 'GLIC/GAC/DAP/PAL/REI/IFTO'), false)
  assert.equal(sicaf.funcaoLigada('sempre', 'GLIC/GAC/DAP/PAL/REI/IFTO'), true)
  assert.equal(sicaf.funcaoLigada('desligada', 'CGOC/GAC/DAP/PAL/REI/IFTO'), false)
})

test('tipo, número SEI e nota pelo nome na árvore', () => {
  assert.equal(sicaf.tipoNaArvore('Nota fiscal nº 063 CHC SOLUÇOES EM SERV. E COM. LTDA (3375105)'), 'nota')
  assert.equal(sicaf.tipoNaArvore('Ateste Fatura Materiais 3375107'), 'ateste')
  assert.equal(sicaf.tipoNaArvore('Folha de Encaminhamento 269 (3376800)'), 'folha')
  assert.equal(sicaf.tipoNaArvore('Sicaf CHC SOLUCOES (3376789)'), 'sicaf')
  assert.equal(sicaf.tipoNaArvore('E-mail 3374972'), null)
  assert.equal(sicaf.numeroSei('Ateste Fatura Materiais 3375107'), '3375107')
  assert.deepEqual(sicaf.lerRotuloDaNota('Nota fiscal nº 063 CHC SOLUÇOES EM SERV. E COM. LTDA (3375105)'), { numero: '63', fornecedor: 'CHC SOLUÇOES EM SERV. E COM. LTDA' })
  assert.deepEqual(sicaf.lerRotuloDaNota('Nota fiscal nº 3.626 HM COMERCIO IMPORTACAO E EXPORTACAO LTDA (3384844)'), { numero: '3626', fornecedor: 'HM COMERCIO IMPORTACAO E EXPORTACAO LTDA' })
})

test('textoDoHtml e lerAteste (modelos de materiais e de serviços)', () => {
  const html = '<p>Empresa: HM COMERCIO</p><p>CNPJ: 14.159.957/0006-02</p><p>N&uacute;mero da nota fiscal: 3.626 ( 3384844 )</p>' +
    '<p>Nota de Empenho: 2026NE174 ( 3339685 )</p><p>Valor da nota fiscal: R$&nbsp;914,60 (novecentos)</p>'
  assert.deepEqual(sicaf.lerAteste(sicaf.textoDoHtml(html)), [{
    empresa: 'HM COMERCIO', cnpj: '14159957000602', notas: ['3626'], seis: ['3384844'], empenhos: ['2026NE174'], valores: ['914,60']
  }])
  const servicos = 'Empresa: VICENTE FILHO SOARES\nCNPJ: 15.267.066/0001-10\nNúmero da nota fiscal: 121\nNúmero do empenho: 2026NE14\nValor da nota fiscal: 3.589,00 (três mil)'
  assert.deepEqual(sicaf.lerAteste(servicos)[0], {
    empresa: 'VICENTE FILHO SOARES', cnpj: '15267066000110', notas: ['121'], seis: [], empenhos: ['2026NE14'], valores: ['3.589,00']
  })
  const duasNotas = 'Empresa: CHC\nCNPJ: 31.302.907/0001-39\nNúmero das notas fiscais: 063 ( 3375105 ) e 064 ( 3375106 )'
  const item = sicaf.lerAteste(duasNotas)[0]
  assert.deepEqual([item.notas, item.seis], [['63', '64'], ['3375105', '3375106']])
})

test('nomes parecidos: abreviações e acentos', () => {
  assert.equal(sicaf.nomesParecidos('CHC SOLUÇOES EM SERV. E COM. LTDA', 'CHC SOLUCOES EM SERVICOS E COMERCIO LTDA'), true)
  assert.equal(sicaf.nomesParecidos('HM COMERCIO IMPORTACAO E EXPORTACAO LTDA', 'HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.'), true)
  assert.equal(sicaf.nomesParecidos('CHC Soluções', 'TRIUNFO ILUMINAÇÃO LTDA'), false)
})

const arvoreExemplo = [
  { id: '1', rotulo: 'Nota fiscal nº 063 CHC SOLUÇOES EM SERV. E COM. LTDA (3375105)', temArquivo: true },
  { id: '2', rotulo: 'Ateste Fatura Materiais 3375107', feitoNoSei: true },
  { id: '3', rotulo: 'Sicaf CHC (3376789)', temArquivo: true },
  { id: '4', rotulo: 'Folha de Encaminhamento 269 (3376800)', feitoNoSei: true },
  { id: '5', rotulo: 'Nota fiscal nº 3.626 HM COMERCIO IMPORTACAO E EXPORTACAO LTDA (3384844)', temArquivo: true },
  { id: '6', rotulo: 'Nota fiscal nº 70 CHC SOLUÇOES EM SERV. E COM. LTDA (3384900)', temArquivo: true },
  { id: '7', rotulo: 'Ateste Fatura Materiais 3384848', feitoNoSei: true },
  { id: '8', rotulo: 'Ateste Fatura Materiais 3384901', feitoNoSei: true },
  { id: '9', rotulo: 'Sicaf CHC SOLUCOES (3384950)', temArquivo: true },
  { id: '10', rotulo: 'Anexo Instrumento de Cobrança NF nº 70 CHC (3384951)', temArquivo: true },
  { id: '11', rotulo: 'Sicaf (3385629)', semConteudo: true }
]

test('situação: só depois da última Folha; Sicaf com o CNPJ no PDF; Anexo pelo número', () => {
  const atestes = {
    7: [{ empresa: 'HM COMERCIO', cnpj: '14159957000602', notas: ['3626'], seis: ['3384844'], empenhos: [], valores: [] }],
    8: [{ empresa: 'CHC SOLUCOES', cnpj: '31302907000139', notas: ['70'], seis: [], empenhos: [], valores: [] }]
  }
  const situacao = sicaf.situacaoDoProcesso(arvoreExemplo, { atestes, cnpjsDosSicafs: { 9: ['31302907000139'] } })
  assert.deepEqual(situacao.notas.map(n => [n.numero, n.cnpj, n.temSicaf, n.anexoFeito]), [['3626', '14159957000602', false, false], ['70', '31302907000139', true, true]])
  // v0.17.6: sem Consulta com o PDF do Simples, a nota 70 também fica pendente.
  assert.deepEqual(situacao.pendentes.map(n => n.numero), ['3626', '70'])
  assert.deepEqual(situacao.sicafs.map(doc => doc.id), ['9'])
  assert.equal(sicaf.textoDoAviso(1), '1 nota sem SICAF ou Simples')
  assert.equal(sicaf.textoDoAviso(2), '2 notas sem SICAF ou Simples')
  // Sem ateste: a nota fica pendente (o CNPJ vem do PDF da nota, na etapa 3).
  assert.equal(sicaf.situacaoDoProcesso(arvoreExemplo).pendentes.length, 2)
})

test('árvore guardada do processo 23236.023830/2025-11: HM pendente, CHC feita (se existir no computador)', () => {
  const caminho = path.join(PASTA, 'paginas-sei/SEI - Árvore Montar.html')
  const ateste = path.join(PASTA, 'paginas-sei/SEI-ateste-nota-materiais.html')
  if (!fs.existsSync(caminho) || !fs.existsSync(ateste)) return
  const { documentos } = lerArvore(fs.readFileSync(caminho, 'latin1'))
  const idAteste = documentos.find(doc => doc.rotulo.includes('3384848')).id
  const atestes = { [idAteste]: sicaf.lerAteste(sicaf.textoDoHtml(fs.readFileSync(ateste, 'utf8'))) }
  const situacao = sicaf.situacaoDoProcesso(documentos, { atestes })
  assert.deepEqual(situacao.pendentes.map(n => [n.numero, n.cnpj, n.sei]), [['3626', '14159957000602', '3384844']])
  assert.match(situacao.pendentes[0].link, /documento_download_anexo/)
  assert.equal(situacao.sicafs.length, 0)
})

// v0.11.0: etapa 2 (CNPJ selecionado).
test('cnpjDaSelecao: só um CNPJ, com ou sem pontos, e confere os dígitos', () => {
  assert.deepEqual(sicaf.cnpjDaSelecao(' 14.159.957/0006-02 '), { cnpj: '14159957000602', valido: true })
  assert.deepEqual(sicaf.cnpjDaSelecao('14159957000602'), { cnpj: '14159957000602', valido: true })
  assert.deepEqual(sicaf.cnpjDaSelecao('CNPJ: 14.159.957/0006-02.'), { cnpj: '14159957000602', valido: true })
  assert.deepEqual(sicaf.cnpjDaSelecao('14.159.957/0006-03'), { cnpj: '14159957000603', valido: false })
  assert.equal(sicaf.cnpjDaSelecao('Nota 14.159.957/0006-02 e 31.302.907/0001-39'), null)
  assert.equal(sicaf.cnpjDaSelecao('030.123.456-06'), null)
  assert.equal(sicaf.cnpjDaSelecao(''), null)
})

// v0.12.0: etapa 3 (CNPJ da nota e conferência com o ateste).
const notaChc = 'DANFE CHC SOLUCOES EM SERVICOS E COMERCIO LTDA Nº 000.000.063 CNPJ 31.302.907/0001-39 ' +
  'INSTITUTO FEDERAL DE EDUCACAO 10.742.006/0003-50 VALOR TOTAL DA NOTA 1.250,00 Empenho 2026NE173 Transportadora 34.028.316/6866-92'
const atesteChc = { empresa: 'CHC SOLUÇOES EM SERV. E COM. LTDA', cnpj: '31302907000139', notas: ['63'], seis: [], empenhos: ['2026NE173'], valores: ['1.250,00'] }

test('conferirNota: tudo igual, sem avisos; emitente antes da transportadora', () => {
  const resultado = sicaf.conferirNota(notaChc, atesteChc)
  assert.equal(resultado.cnpj, '31302907000139')
  assert.equal(resultado.escolher, false)
  assert.deepEqual(resultado.avisos, [])
})

test('conferirNota: diferenças em vermelho; nome só em amarelo', () => {
  const ateste = { ...atesteChc, empresa: 'OUTRA EMPRESA QUALQUER', cnpj: '14159957000602', notas: ['64'], empenhos: ['2026NE999'], valores: ['9,99'] }
  const resultado = sicaf.conferirNota(notaChc, ateste)
  assert.equal(resultado.escolher, true)
  assert.deepEqual(resultado.opcoes, ['31302907000139', '14159957000602'])
  assert.deepEqual(resultado.avisos.map(aviso => aviso.nivel), ['vermelho', 'vermelho', 'vermelho', 'vermelho', 'amarelo'])
  assert.match(resultado.avisos[0].texto, /CNPJ diferente/)
})

test('conferirNota: tomador de outra unidade do IFTO ou sem o Campus Palmas', () => {
  const reitoria = sicaf.conferirNota(notaChc.replace('10.742.006/0003-50', '10.742.006/0001-98'), atesteChc)
  assert.match(reitoria.avisos[0].texto, /outra unidade do IFTO \(CNPJ 10\.742\.006\/0001-98\)/)
  const sem = sicaf.conferirNota(notaChc.replace('10.742.006/0003-50', ''), atesteChc)
  assert.match(sem.avisos[0].texto, /não tem o CNPJ do Campus Palmas/)
})

test('conferirNota: nota escaneada pede para conferir o CNPJ; sem ateste só avisa', () => {
  const imagem = sicaf.conferirNota('  1 2 ', atesteChc)
  assert.deepEqual([imagem.cnpj, imagem.escolher, imagem.avisos[0].nivel], ['31302907000139', true, 'amarelo'])
  const semAteste = sicaf.conferirNota(notaChc, null)
  assert.deepEqual([semAteste.cnpj, semAteste.escolher, semAteste.avisos.map(a => a.nivel)], ['31302907000139', false, ['amarelo']])
})

test('nota sem empenho escrito não é conferida pelo empenho', () => {
  const resultado = sicaf.conferirNota(notaChc.replace('Empenho 2026NE173', ''), { ...atesteChc, empenhos: ['2026NE1'] })
  assert.deepEqual(resultado.avisos, [])
  assert.deepEqual(sicaf.empenhosDoTexto('NE: 2026 NE 000174 e 2026NE14'), ['2026NE174', '2026NE14'])
})

test('agruparPorFornecedor: um conjunto por CNPJ', () => {
  const grupos = sicaf.agruparPorFornecedor([{ cnpj: 'A', numero: '63', fornecedor: 'CHC' }, { cnpj: 'B', numero: '1' }, { cnpj: 'A', numero: '64' }, { cnpj: null }])
  assert.deepEqual(grupos.map(g => [g.cnpj, g.nome, g.notas.map(n => n.numero)]), [['A', 'CHC', ['63', '64']], ['B', '', ['1']]])
})

test('notas fiscais de exemplo: CNPJ do emitente e Campus Palmas como tomador (se existirem no computador)', async () => {
  const pasta = path.join(PASTA, 'notas-fiscais')
  if (!fs.existsSync(pasta)) return
  const { pathToFileURL } = require('node:url')
  // Igual a sites/sei/pdf-texto.js: o pdf.js trabalha sem "worker" separado.
  globalThis.pdfjsWorker = await import(pathToFileURL(path.join(__dirname, '../bibliotecas/pdfjs/pdf.worker.min.mjs')).href)
  const pdfjs = await import(pathToFileURL(path.join(__dirname, '../bibliotecas/pdfjs/pdf.min.mjs')).href)
  const texto = async arquivo => {
    const documento = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(path.join(pasta, arquivo))), isEvalSupported: false, disableFontFace: true, verbosity: 0 }).promise
    let saida = ''
    for (let n = 1; n <= documento.numPages; n++) saida += (await (await documento.getPage(n)).getTextContent()).items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('') + '\n'
    return saida
  }
  const esperados = {
    '16___2026000001624___IFTO_PALMAS.pdf': '04795101000157',
    'NFe___63___CHC_Solucoes___Empenho_1.pdf': '31302907000139',
    'NF_IFTO_NOV2026.pdf': '15267066000110',
    'NF_n__547022_Abastecimento_Outubro_2026.pdf': '05340639000130',
    'NF_Volus_Servicos.pdf': '03817702000150'
  }
  for (const [arquivo, cnpj] of Object.entries(esperados)) {
    if (!fs.existsSync(path.join(pasta, arquivo))) continue
    const resultado = sicaf.conferirNota(await texto(arquivo), null)
    assert.equal(resultado.cnpj, cnpj, arquivo)
    assert.deepEqual(resultado.avisos.filter(aviso => aviso.nivel === 'vermelho'), [], arquivo)
  }
})

// v0.13.0: etapa 4 (SICAF).
test('paginaDoCompras pelo endereço', () => {
  assert.equal(sicaf.paginaDoCompras('https://www3.comprasnet.gov.br/sicaf-web/private/geral/consultarSituacaoFornecedor.jsf'), 'consulta')
  assert.equal(sicaf.paginaDoCompras('https://www3.comprasnet.gov.br/sicaf-web/private/index.jsf'), 'sicaf')
  assert.equal(sicaf.paginaDoCompras('https://www3.comprasnet.gov.br/sicaf-web/public/pages/acessoNegado.jsf'), 'acessoNegado')
  assert.equal(sicaf.paginaDoCompras('https://comprasnet.gov.br/seguro/loginPortalUASG.asp'), 'login')
  assert.equal(sicaf.paginaDoCompras('https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-area-trabalho-web/seguro/governo/area-trabalho'), 'areaDeTrabalho')
  assert.equal(sicaf.paginaDoCompras('https://sso.acesso.gov.br/login'), null)
  assert.equal(sicaf.paginaDoCompras('não é endereço'), null)
})

test('nome do arquivo, linha do resultado e PDF do SICAF', () => {
  assert.equal(sicaf.nomeDoArquivo('14.159.957/0006-02', new Date(2026, 10, 3)), 'consultarSituacaoFornecedor_14159957000602_2026-11-03.pdf')
  assert.deepEqual(sicaf.lerLinhaDoResultado(' 14.159.957/0006-02 - HM COMERCIO IMPORTACAO E EXPORTACAO LTDA. '), { cnpj: '14159957000602', nome: 'HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.' })
  assert.equal(sicaf.lerLinhaDoResultado('Fornecedor'), null)
  // v0.17.5: linha inteira com o script do SICAF não suja o nome
  assert.equal(sicaf.lerLinhaDoResultado('14.159.957/0006-02 - HM COMERCIO LTDA.Relatórios Situação do FornecedorproximoPasso = function() {PrimeFaces.ab({})}').nome, 'HM COMERCIO LTDA.')
  const texto = 'Dados do Fornecedor\nCNPJ: 14.159.957/0006-02 DUNS®: 893438672\nRazão Social: HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.\nNome Fantasia:'
  assert.deepEqual(sicaf.lerPdfDoSicaf(texto), { cnpj: '14159957000602', razaoSocial: 'HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.' })
})

test('base64 vai e volta', () => {
  const bytes = new Uint8Array(70000).map((_, i) => (i * 7) % 256)
  assert.deepEqual(sicaf.deBase64(sicaf.paraBase64(bytes)), bytes)
})

test('resultado guardado do SICAF: linha do fornecedor (se existir no computador)', () => {
  const caminho = path.join(PASTA, 'pagina-compras/SICAF - Sistema de Cadastramento Unificado de Fornecedores3.html')
  if (!fs.existsSync(caminho)) return
  const html = fs.readFileSync(caminho, 'utf8')
  const rotulo = /id="form:fornecedores:0:j_idt202"[^>]*>([^<]*)</.exec(html)[1]
  assert.deepEqual(sicaf.lerLinhaDoResultado(rotulo), { cnpj: '14159957000602', nome: 'HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.' })
})

test('manifest: acesso opcional ao Compras e ao Simples Nacional igual às origens das regras', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf8'))
  assert.deepEqual(manifest.optional_host_permissions, [...sicaf.ORIGENS_COMPRAS, ...require('../comum/simples-nacional.js').ORIGENS_SIMPLES])
  assert.deepEqual(manifest.optional_permissions, ['downloads'])
})

// v0.14.0: etapa 5 (inclusão no SEI).
test('nomes na árvore: até 50 letras, sem cortar palavra', () => {
  assert.equal(sicaf.nomeDoSicaf('HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.'), 'HM COMERCIO IMPORTACAO E EXPORTACAO LTDA')
  assert.equal(sicaf.nomeDoAnexo('63', 'CHC Soluções'), 'Instrumento de Cobrança NF nº 63 CHC Soluções')
  const longo = sicaf.nomeDoAnexo('63', 'CHC SOLUÇOES EM SERV. E COM. LTDA')
  assert.equal(longo, 'Instrumento de Cobrança NF nº 63 CHC SOLUÇOES EM')
  assert.ok(longo.length <= 50)
  assert.equal(sicaf.nomeNaArvore('x'.repeat(60)).length, 50)
})

test('documentos: Sicaf e Consulta (com PDF) por fornecedor, Anexo por nota sem Anexo', () => {
  const fornecedores = [
    { cnpj: 'A', nomeNoSicaf: 'CHC LTDA.', temPdf: true, temSimples: true, nomeConsulta: 'Simples Nacional CHC LTDA', notas: [{ numero: '63', fornecedor: 'CHC' }, { numero: '64', fornecedor: 'CHC' }, { numero: '65', anexoFeito: true }] },
    { cnpj: 'B', nomeNoSicaf: 'SEM PDF', temPdf: false, temSimples: false, notas: [] }
  ]
  assert.deepEqual(sicaf.documentosParaIncluir(fornecedores).map(d => [d.tipo, d.nomeArvore]), [
    ['Sicaf', 'CHC LTDA'], ['Consulta', 'Simples Nacional CHC LTDA'], ['Anexo', 'Instrumento de Cobrança NF nº 63 CHC'], ['Anexo', 'Instrumento de Cobrança NF nº 64 CHC']
  ])
  // Fora da CGOC: só o que o botão pediu.
  assert.deepEqual(sicaf.documentosParaIncluir(fornecedores, { simples: false, anexo: false }).map(d => d.tipo), ['Sicaf'])
  assert.deepEqual(sicaf.documentosParaIncluir(fornecedores, { sicaf: false, anexo: false }).map(d => d.tipo), ['Consulta'])
})

test('situação: Consulta com o PDF do Simples conta pela raiz do CNPJ (matriz ou filial)', () => {
  const atestes = { 8: [{ empresa: 'CHC SOLUCOES', cnpj: '31302907000139', notas: ['70'], seis: [], empenhos: [], valores: [] }] }
  const documentos = [...arvoreExemplo, { id: '12', rotulo: 'Consulta Simples Nacional CHC (3385700)', temArquivo: true }]
  const situacao = sicaf.situacaoDoProcesso(documentos, { atestes, cnpjsDosSicafs: { 9: ['31302907000139'] }, cnpjsDasConsultas: { 12: ['31302907000210'] } })
  assert.deepEqual(situacao.notas.find(n => n.numero === '70').temConsulta, true)
  assert.deepEqual(situacao.pendentes.map(n => n.numero), ['3626'])
  assert.deepEqual(situacao.consultas.map(doc => doc.id), ['12'])
})

test('resposta do envio do arquivo ao SEI e linha da tabela de anexos', () => {
  const upload = sicaf.lerRespostaDoUpload('<html><body>abc123.tmp#consultarSituacaoFornecedor_1.pdf#application/pdf#105000#13/11/2026 10:00:00#</body></html>')
  assert.deepEqual(upload, { nomeUpload: 'abc123.tmp', nome: 'consultarSituacaoFornecedor_1.pdf', tipo: 'application/pdf', tamanho: '105000', dataHora: '13/11/2026 10:00:00' })
  assert.deepEqual(sicaf.lerRespostaDoUpload('ERRO#Arquivo vazio'), { erro: 'Arquivo vazio' })
  const html = "objTabelaAnexos.adicionar([arr['nome_upload'],arr['nome'],arr['data_hora'],arr['tamanho'],infraFormatarTamanhoBytes(arr['tamanho']),'2382960' ,'CGOC/GAC/DAP/PAL/REI/IFTO']);"
  const usuario = sicaf.lerUsuarioDoUpload(html)
  assert.deepEqual(usuario, { idUsuario: '2382960', sigla: 'CGOC/GAC/DAP/PAL/REI/IFTO' })
  assert.equal(sicaf.linhaDoAnexo(upload, usuario), 'abc123.tmp±consultarSituacaoFornecedor_1.pdf±13/11/2026 10:00:00±105000±103 Kb±2382960±CGOC/GAC/DAP/PAL/REI/IFTO')
})

test('página guardada do documento externo: usuário da tabela de anexos (se existir no computador)', () => {
  const caminho = path.join(PASTA, 'paginas-sei/SEI-registrar-documento-externo.html')
  if (!fs.existsSync(caminho)) return
  assert.deepEqual(sicaf.lerUsuarioDoUpload(fs.readFileSync(caminho, 'latin1')), { idUsuario: '2382960', sigla: 'CGOC/GAC/DAP/PAL/REI/IFTO' })
})

// v0.16.0: aproveitar Sicaf, Consulta e Anexo em branco.
test('aproveitarEmBranco: só os sem nome, depois da última Folha, na ordem', () => {
  const documentos = [
    { id: '1', rotulo: 'Sicaf (3300001)', linkAlterar: 'a1' },
    { id: '2', rotulo: 'Folha de Encaminhamento 269 (3376800)', feitoNoSei: true },
    { id: '3', rotulo: 'Sicaf (3385629)', semConteudo: true, linkAlterar: 'a3' },
    { id: '4', rotulo: 'Consulta (3385630)', semConteudo: true, linkAlterar: 'a4' },
    { id: '5', rotulo: 'Anexo Instrumento de Cobrança NF nº 9 X (3385631)', linkAlterar: 'a5' },
    { id: '6', rotulo: 'Anexo (3385632)', semConteudo: true, linkAlterar: 'a6' }
  ]
  const itens = [{ tipo: 'Sicaf' }, { tipo: 'Consulta' }, { tipo: 'Anexo', nota: '63' }, { tipo: 'Anexo', nota: '64' }]
  assert.deepEqual(sicaf.aproveitarEmBranco(itens, documentos).map(item => item.emBranco ? item.emBranco.sei + ':' + item.emBranco.linkAlterar : null), ['3385629:a3', '3385630:a4', '3385632:a6', null])
})

test('árvore guardada: link para alterar o Sicaf em branco (se existir no computador)', () => {
  const caminho = path.join(PASTA, 'paginas-sei/SEI - Árvore Montar.html')
  if (!fs.existsSync(caminho)) return
  const { documentos } = lerArvore(fs.readFileSync(caminho, 'latin1'))
  const itens = sicaf.aproveitarEmBranco([{ tipo: 'Sicaf' }, { tipo: 'Consulta' }, { tipo: 'Anexo' }], documentos)
  assert.deepEqual(itens.map(item => item.emBranco.sei), ['3385629', '3385630', '3385631'])
  assert.match(itens[0].emBranco.linkAlterar, /^controlador\.php\?acao=documento_alterar_recebido&.*id_documento=3663596&.*infra_hash=/)
})

// v0.17.3: a página lida sem abrir a tela não tem o endereço do formulário (erro 404 no envio do arquivo).
test('enderecoDoUpload: endereço tirado do script do SEI', () => {
  const html = "<form id=\"frmAnexos\" target=\"ifrfrmAnexos\">\nobjUpload = new infraUpload('frmAnexos','controlador.php?acao=documento_upload_anexo&arvore=1&id_serie=-1&infra_hash=abc', true);"
  assert.equal(sicaf.enderecoDoUpload(html), 'controlador.php?acao=documento_upload_anexo&arvore=1&id_serie=-1&infra_hash=abc')
  assert.equal(sicaf.enderecoDoUpload('<form id="frmAnexos" method="post" action="controlador.php?acao=documento_upload_anexo&amp;x=1">'), 'controlador.php?acao=documento_upload_anexo&x=1')
  assert.equal(sicaf.enderecoDoUpload('<form id="frmAnexos">'), null)
})

test('conferirNota: nota que não abriu não é chamada de imagem', () => {
  const falhou = sicaf.conferirNota('', atesteChc, { naoLeu: true })
  assert.equal(falhou.cnpj, '31302907000139')
  assert.match(falhou.avisos[0].texto, /Não consegui ler a nota/)
  assert.equal(sicaf.paginaDoCompras(sicaf.URL_AREA_DE_TRABALHO), 'areaDeTrabalho')
})
