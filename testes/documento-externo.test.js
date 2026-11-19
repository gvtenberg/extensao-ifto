const { test } = require('node:test')
const assert = require('node:assert/strict')
const { ehDocumentoExternoNovo, ehDocumentoInternoNovo, dataDeHoje, oQuePreencher } = require('../comum/documento-externo.js')

// v0.6.0: só o documento externo novo é preenchido; o que já existe no SEI não muda.
test('documento externo novo: página documento_receber', () => {
  assert.equal(ehDocumentoExternoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=documento_receber&acao_origem=documento_escolher_tipo&id_serie=-1'), true)
  assert.equal(ehDocumentoExternoNovo('controlador.php?acao=documento_receber&acao_origem=documento_receber'), true)
})

test('documento externo que já existe não é novo', () => {
  assert.equal(ehDocumentoExternoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=documento_alterar_recebido&id_documento=1'), false)
  assert.equal(ehDocumentoExternoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=documento_escolher_tipo&acao_origem=documento_receber'), false)
  assert.equal(ehDocumentoExternoNovo(''), false)
})

test('data de hoje no formato do SEI', () => {
  assert.equal(dataDeHoje(new Date(2026, 10, 12)), '12/11/2026')
  assert.equal(dataDeHoje(new Date(2027, 0, 5)), '05/01/2027')
})

test('preenche só o que está vazio', () => {
  assert.deepEqual(oQuePreencher({ data: '', formatoMarcado: false, nivelMarcado: false }), { data: true, formato: true, nivel: true })
  assert.deepEqual(oQuePreencher({ data: '01/11/2026', formatoMarcado: true, nivelMarcado: true }), { data: false, formato: false, nivel: false })
  assert.deepEqual(oQuePreencher({ data: '  ', formatoMarcado: true, nivelMarcado: false }), { data: true, formato: false, nivel: true })
})

// v0.22.2: documento interno novo (ex.: Edital Gabinete) também recebe o nível Público.
test('documento interno novo: página documento_gerar', () => {
  assert.equal(ehDocumentoInternoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=documento_gerar&acao_origem=documento_escolher_tipo&id_serie=317'), true)
  assert.equal(ehDocumentoInternoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=documento_alterar&id_documento=1'), false)
  assert.equal(ehDocumentoInternoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=documento_receber'), false)
})

// v0.27.0 (spec base-e-sei, etapa 2, D14): tipo do documento pelo nome do arquivo.
const { tipoPeloNome, lerRegras, regrasEmTexto, avisosDoArquivo, corrigirNomeDoArquivo, tamanhoEmTexto, LIMITE_SEI } = require('../comum/documento-externo.js')
const TIPOS = ['Anexo', 'Nota', 'Nota fiscal', 'Nota Técnica', 'Sicaf', 'Certidão', 'Consulta']

test('tipo pelo nome: o nome de tipo mais longo que começa o arquivo', () => {
  assert.deepEqual(tipoPeloNome('Nota Fiscal 123.pdf', TIPOS), { tipo: 'Nota fiscal', origem: 'nome', nomeArvore: '123' })
  assert.deepEqual(tipoPeloNome('nota_fiscal_45.pdf', TIPOS), { tipo: 'Nota fiscal', origem: 'nome', nomeArvore: '45' })
  assert.equal(tipoPeloNome('Nota 7.pdf', TIPOS).tipo, 'Nota')
  assert.equal(tipoPeloNome('certidao FGTS.pdf', TIPOS).tipo, 'Certidão')
  assert.equal(tipoPeloNome('Sicaf - Empresa X.pdf', TIPOS).nomeArvore, 'Empresa X')
  assert.equal(tipoPeloNome('Sicaf.pdf', TIPOS).nomeArvore, '')
})

test('tipo pelo nome: palavra só parecida não conta', () => {
  assert.equal(tipoPeloNome('Notas da reunião.pdf', TIPOS).tipo, null)
  assert.equal(tipoPeloNome('Anexos.pdf', TIPOS).tipo, null)
})

test('tipo pelo nome: depois as regras da pessoa, depois o tipo padrão', () => {
  const regras = lerRegras('SICAF = Sicaf\nfgts=Certidão\nlinha sem igual\n = Anexo')
  assert.deepEqual(regras, [{ contem: 'SICAF', tipo: 'Sicaf' }, { contem: 'fgts', tipo: 'Certidão' }])
  assert.equal(regrasEmTexto(regras), 'SICAF = Sicaf\nfgts = Certidão')
  assert.deepEqual(tipoPeloNome('relatório sicaf empresa.pdf', TIPOS, { regras }), { tipo: 'Sicaf', origem: 'regra', nomeArvore: 'relatório sicaf empresa' })
  assert.deepEqual(tipoPeloNome('relatório.pdf', TIPOS, { regras, padrao: 'anexo' }), { tipo: 'Anexo', origem: 'padrao', nomeArvore: 'relatório' })
  // Regra ou padrão com tipo que não existe no SEI: nada.
  assert.equal(tipoPeloNome('relatório.pdf', TIPOS, { regras: [{ contem: 'rel', tipo: 'Inexistente' }], padrao: 'Outro' }).tipo, null)
})

test('nome na árvore com no máximo 50 letras', () => {
  assert.ok(tipoPeloNome('Anexo ' + 'palavra '.repeat(10) + '.pdf', TIPOS).nomeArvore.length <= 50)
})

test('nome do arquivo: só o "#" vira "_" (D9)', () => {
  assert.equal(corrigirNomeDoArquivo('NF #12 ção–x.pdf'), 'NF _12 ção–x.pdf')
  assert.equal(corrigirNomeDoArquivo('sem nada.pdf'), 'sem nada.pdf')
})

test('tamanho: limite de 10 MiB e dica para PDF acima de 2 MB (D10, D11, D12)', () => {
  assert.equal(LIMITE_SEI, 10485760)
  assert.equal(tamanhoEmTexto(10600000), '10,1 MB')
  assert.equal(avisosDoArquivo({ nome: 'a.pdf', tamanho: 10200000 })[0].nivel, 'dica')
  assert.equal(avisosDoArquivo({ nome: 'a.pdf', tamanho: 10600000 })[0].nivel, 'erro')
  const planilha = avisosDoArquivo({ nome: 'a.xlsx', tamanho: 10600000 })[0]
  assert.equal(planilha.nivel, 'erro')
  assert.match(planilha.partes.join(' '), /zip/)
  assert.deepEqual(avisosDoArquivo({ nome: 'a.xlsx', tamanho: 5000000 }), [])
  assert.deepEqual(avisosDoArquivo({ nome: 'a.pdf', tamanho: 1000000 }), [])
})

// v0.27.1 (etapa 3): arquivo arrastado para a árvore, pronto para a lista de conferência.
const { prepararArquivo } = require('../comum/documento-externo.js')
test('arquivo arrastado: tipo, nome na árvore, data e bloqueios', () => {
  const opcoes = { externoCorrigirNome: true, externoNomeArvore: true, externoRegras: [], externoTipoPadrao: '' }
  const nota = prepararArquivo({ nome: 'Nota Fiscal #123.pdf', tamanho: 50000, modificado: new Date(2026, 0, 5).getTime() }, TIPOS, opcoes)
  assert.equal(nota.nome, 'Nota Fiscal _123.pdf')
  assert.equal(nota.tipo, 'Nota fiscal')
  assert.equal(nota.nomeArvore, '#123')
  assert.equal(nota.bloqueado, false)
  assert.equal(nota.avisos[0].nivel, 'dica')
  assert.equal(nota.data, dataDeHoje())
  // D6: data do arquivo quando a opção está ligada.
  assert.equal(prepararArquivo({ nome: 'a.pdf', tamanho: 1, modificado: new Date(2026, 0, 5).getTime() }, TIPOS, { ...opcoes, arrastarDataDoArquivo: true }).data, '05/01/2026')
  // Tipo não reconhecido: a extensão pergunta (tipo null).
  assert.equal(prepararArquivo({ nome: 'relatório.pdf', tamanho: 1 }, TIPOS, opcoes).tipo, null)
  // Acima do limite ou "#" com a troca desligada: não vai.
  assert.equal(prepararArquivo({ nome: 'grande.pdf', tamanho: 11000000 }, TIPOS, opcoes).bloqueado, true)
  assert.equal(prepararArquivo({ nome: 'a#1.pdf', tamanho: 1 }, TIPOS, { ...opcoes, externoCorrigirNome: false }).bloqueado, true)
  assert.equal(prepararArquivo({ nome: 'Anexo X.pdf', tamanho: 1 }, TIPOS, { ...opcoes, externoNomeArvore: false }).nomeArvore, '')
})
