const { test } = require('node:test')
const assert = require('node:assert/strict')
const { ehDocumentoExternoNovo, ehDocumentoInternoNovo, ehProcessoNovo, dataDeHoje, oQuePreencher } = require('../comum/documento-externo.js')

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

// v0.33.0: processo novo (Iniciar Processo e Iniciar Processo Relacionado) também recebe o nível Público.
test('processo novo: procedimento_gerar e procedimento_gerar_relacionado', () => {
  assert.equal(ehProcessoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=procedimento_gerar&acao_origem=procedimento_escolher_tipo'), true)
  assert.equal(ehProcessoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=procedimento_gerar_relacionado&arvore=1'), true)
  assert.equal(ehProcessoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=procedimento_gerar_pdf&id_procedimento=1'), false)
  assert.equal(ehProcessoNovo('https://sei.ifto.edu.br/sei/controlador.php?acao=procedimento_alterar&id_procedimento=1'), false)
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
  // v0.29.3 (T170): palavras juntas com maiúscula no meio, como o arquivo do Simples Nacional.
  assert.deepEqual(tipoPeloNome('ConsultaOptantes_51866043000195_2026-11-19.pdf', TIPOS), { tipo: 'Consulta', origem: 'nome', nomeArvore: 'Optantes 51866043000195 2026-11-19' })
  assert.equal(tipoPeloNome('CONSULTAOPTANTES.pdf', TIPOS).tipo, null)
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

// v0.32.0: arquivo solto na página de um documento externo em branco.
test('documento externo em branco aberto à direita', () => {
  const { externoEmBranco, prepararArquivo } = require('../comum/documento-externo.js')
  const branco = { id: '3670301', rotulo: 'Minuta Termo de Convênio (3391978)', semConteudo: true, temArquivo: false, linkAlterar: 'controlador.php?acao=documento_alterar_recebido&id_documento=3670301' }
  const comArquivo = { ...branco, id: '2', semConteudo: false, temArquivo: true }
  const interno = { ...branco, id: '3', linkAlterar: '' }
  const pagina = id => 'https://sei.ifto.edu.br/sei/controlador.php?acao=arvore_visualizar&id_procedimento=3669881&id_documento=' + id
  assert.deepEqual(externoEmBranco([comArquivo, branco], pagina('3670301')), { id: '3670301', sei: '3391978', rotulo: branco.rotulo, linkAlterar: branco.linkAlterar })
  assert.equal(externoEmBranco([comArquivo], pagina('2')), null)
  assert.equal(externoEmBranco([interno], pagina('3')), null)
  assert.equal(externoEmBranco([branco], 'https://sei.ifto.edu.br/sei/controlador.php?acao=arvore_visualizar&id_procedimento=3669881'), null)
  assert.equal(externoEmBranco([branco], ''), null)
  // Sem lista de tipos (o tipo do documento não muda): só nome e avisos.
  const pronto = prepararArquivo({ nome: 'nota #1.pdf', tamanho: 1000 }, [], {})
  assert.equal(pronto.nome, 'nota _1.pdf')
  assert.equal(pronto.bloqueado, false)
  assert.equal(prepararArquivo({ nome: 'a.pdf', tamanho: 11 * 1024 * 1024 }, [], {}).bloqueado, true)
})

// v0.36.1: maiúsculas, sinais e acentos estragados no nome do arquivo.
test('tipo pelo nome: maiúsculas, sinais e letra acentuada estragada', () => {
  const tipos = ['Relatório', 'Relatório Parcial', 'Portaria de Pessoal', 'Portaria Normativa', 'Relatório de Viagem - FAPTO', 'Certidão', 'Ata']
  const tipo = nome => tipoPeloNome(nome, tipos).tipo
  for (const nome of ['RELATÓRIO.pdf', 'RelaTóRio_final.pdf', 'relatorio-', 'RELATORIO_-_2026.pdf', '_Relatório.pdf', '(Relatório) x.pdf', 'Relatório'.normalize('NFD') + '_1.pdf',
    'RelatÃ³rio 3.pdf', 'Relat¢rio.pdf', 'Relat�rio_x.pdf', 'Relatório.pdf', 'Relat_rio 5.pdf', 'Relato╠ürio.pdf']) assert.equal(tipo(nome), 'Relatório', nome)
  assert.equal(tipo('RELATÓRIO_PARCIAL-2.pdf'), 'Relatório Parcial')
  assert.equal(tipo('Relatorio-de-viagem-fapto.pdf'), 'Relatório de Viagem - FAPTO')
  assert.equal(tipo('PORTARIA_NORMATIVA_3.pdf'), 'Portaria Normativa')
  assert.equal(tipo('CertidÃ£o.pdf'), 'Certidão')
  for (const nome of ['Relatórios.pdf', 'Atas.pdf', 'Ataíde.pdf', 'RELATORIOFINAL.pdf']) assert.equal(tipo(nome), null, nome)
  assert.equal(tipoPeloNome('RELATÓRIO_-_obra.pdf', tipos).nomeArvore, 'obra')
})
test('tipo pelo nome: nome que serve a mais de um tipo só sugere', () => {
  const tipos = ['Portaria de Pessoal', 'Portaria Normativa', 'Nota']
  assert.deepEqual(tipoPeloNome('portaria_.pdf', tipos).sugestoes, ['Portaria de Pessoal', 'Portaria Normativa'])
  assert.equal(tipoPeloNome('PORTARIA 12.pdf', tipos).tipo, null)
  assert.equal(tipoPeloNome('portaria_12.pdf', tipos, { padrao: 'Nota' }).tipo, 'Nota')
  assert.equal(tipoPeloNome('outra coisa.pdf', tipos).sugestoes, undefined)
})
