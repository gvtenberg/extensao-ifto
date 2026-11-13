const { test } = require('node:test')
const assert = require('node:assert/strict')
const { TIPOS, funcaoLigada } = require('../comum/documentos-pagamento.js')

// v0.7.0: botão dos documentos do pagamento.
test('tipos na ordem: Sicaf, Consulta, Anexo', () => {
  assert.deepEqual([...TIPOS], ['Sicaf', 'Consulta', 'Anexo'])
})

test('automática: só na CGOC', () => {
  assert.equal(funcaoLigada('automatica', 'CGOC/GAC/DAP/PAL/REI/IFTO'), true)
  assert.equal(funcaoLigada('automatica', ' cgoc/gac/dap/pal/rei/ifto '), true)
  assert.equal(funcaoLigada('automatica', 'PAL/REI/IFTO'), false)
  assert.equal(funcaoLigada(undefined, ''), false)
})

test('sempre ligada e desligada valem em qualquer unidade', () => {
  assert.equal(funcaoLigada('sempre', 'PAL/REI/IFTO'), true)
  assert.equal(funcaoLigada('desligada', 'CGOC/GAC/DAP/PAL/REI/IFTO'), false)
})

// v0.8.0: leitura da árvore do processo (formato do SEI 5.0.4, quadro ifrArvore).
const { lerArvore, documentosEmBranco, acharOpcao, listaEmTexto, textoDaConfirmacao, codificarLatin1, montarCorpo, trocarCampos, mensagemDoSei } = require('../comum/documentos-pagamento.js')
const arvore = [
  'Nos[0] = new infraArvoreNo("PROCESSO","3479546",null,"controlador.php?acao=arvore_visualizar","ifrVisualizacao","23236.012523/2026-88","Gestão","svg/processo.svg?25",null,null,true,true,null,null,null,null);',
  'Nos[1] = new infraArvoreNo("PASTA","PASTA2","3479546","javascript:abrirFecharPasta(\'PASTA2\')",null,"II","II",null,null,null,true,true,null,null,null);',
  'Nos[2] = new infraArvoreNo("DOCUMENTO","3497441","PASTA2","controlador.php?x","ifrConteudoVisualizacao","Documento CNH (3228999)","Documento CNH (3228999)","svg/documento_pdf.svg?25",null,null,true,true,null,null,null,null);',
  'Nos[3] = new infraArvoreNo("DOCUMENTO","3497536","PASTA2","controlador.php?x","ifrConteudoVisualizacao","Despacho 163 (3229092)","Despacho 163 (3229092)","svg/documento_interno.svg?25",null,null,true,true,null,null,null,null);',
  'Nos[4] = new infraArvoreNo("DOCUMENTO","3600001","PASTA2","controlador.php?x","ifrConteudoVisualizacao","Sicaf (3400001)","Sicaf (3400001)","svg/documento_sem_conteudo.svg?25",null,null,true,true,null,null,null,null);',
  'Nos[5] = new infraArvoreNo("DOCUMENTO","3600002","PASTA2","controlador.php?x","ifrConteudoVisualizacao","Sicaf (3300001)","Sicaf (3300001)","svg/documento_generico.svg?25",null,null,true,true,null,null,null,null);',
  'Nos[5].src = \'controlador.php?acao=documento_download_anexo&id_anexo=1\';',
  'Nos[6] = new infraArvoreNo("DOCUMENTO","3600003","PASTA2","controlador.php?x","ifrConteudoVisualizacao","Anexo III (3400003)","Anexo III (3400003)","svg/documento_generico.svg?25",null,null,true,true,null,null,null,null);',
  ''
].join('\n')

test('lerArvore: processo, documentos, feito no SEI e com arquivo', () => {
  const { idProcesso, numero, documentos } = lerArvore(arvore)
  assert.equal(idProcesso, '3479546')
  assert.equal(numero, '23236.012523/2026-88')
  assert.equal(documentos.length, 5)
  assert.deepEqual(documentos.map(doc => [doc.feitoNoSei, doc.temArquivo]), [[false, true], [true, false], [false, false], [false, true], [false, false]])
  assert.equal(documentos[2].semConteudo, true)
})

test('documentos em branco: só Sicaf, Consulta ou Anexo externos sem arquivo', () => {
  const emBranco = documentosEmBranco(lerArvore(arvore).documentos)
  assert.deepEqual(emBranco.map(doc => doc.rotulo), ['Sicaf (3400001)', 'Anexo III (3400003)'])
})

test('lerArvore com a árvore guardada do SEI (se existir no computador)', () => {
  const fs = require('node:fs')
  const caminho = require('node:path').join(__dirname, '../ferramentas-de-teste/paginas-sei/SEI - 23236.012523_2026-88_files/controlador_uiXL.html')
  if (!fs.existsSync(caminho)) return
  const { idProcesso, documentos } = lerArvore(fs.readFileSync(caminho, 'latin1'))
  assert.equal(idProcesso, '3479546')
  assert.equal(documentos.length, 13)
  assert.equal(documentosEmBranco(documentos).length, 0)
})

test('acharOpcao pelo nome exato do tipo', () => {
  const opcoes = [{ valor: '583', texto: 'Protocolo de Atendimento ao Estudante - Anexo III' }, { valor: '369', texto: 'Anexo' }, { valor: '277', texto: 'Sicaf' }]
  assert.equal(acharOpcao(opcoes, 'Anexo').valor, '369')
  assert.equal(acharOpcao(opcoes, 'sicaf ').valor, '277')
  assert.equal(acharOpcao(opcoes, 'Consulta'), null)
})

// v0.9.0: texto curto (decisão D9).
test('texto da confirmação, curto, com e sem avisos', () => {
  assert.equal(listaEmTexto(['Sicaf', 'Consulta', 'Anexo']), 'Sicaf, Consulta e Anexo')
  assert.equal(textoDaConfirmacao({}), 'Incluir Sicaf, Consulta e Anexo neste processo?')
  const emBranco = [{ rotulo: 'Anexo (3)' }, { rotulo: 'Sicaf (1)' }, { rotulo: 'Sicaf (2)' }]
  assert.equal(textoDaConfirmacao({ jaIncluidosHoje: true, emBranco }), 'Este processo já tem Sicaf e Anexo sem arquivo. Incluir mais três?')
  assert.equal(textoDaConfirmacao({ jaIncluidosHoje: true }), 'Sicaf, Consulta e Anexo já foram incluídos hoje pela extensão. Incluir mais três?')
})

// v0.9.0: formulário enviado direto ao SEI (decisão D8).
test('corpo do formulário em latim-1, como o navegador envia ao SEI', () => {
  assert.equal(codificarLatin1('Campus Palmas'), 'Campus+Palmas')
  assert.equal(codificarLatin1('100004274±Público'), '100004274%B1P%FAblico')
  assert.equal(codificarLatin1('12/11/2026'), '12%2F11%2F2026')
  assert.equal(codificarLatin1('€'), '%26%238364%3B')
  assert.equal(codificarLatin1(null), '')
  const campos = trocarCampos([['a', '1'], ['rdo', 'X'], ['b', '']], { rdo: 'N', novo: 'é' })
  assert.deepEqual(campos, [['a', '1'], ['b', ''], ['rdo', 'N'], ['novo', 'é']])
  assert.equal(montarCorpo(campos), 'a=1&b=&rdo=N&novo=%E9')
})

test('mensagem de erro do SEI na página devolvida', () => {
  assert.equal(mensagemDoSei('<div id="divInfraExcecao" class="x"><b>Erro:</b>&nbsp;Data inválida.</div>'), 'Erro: Data inválida.')
  assert.equal(mensagemDoSei('<form id="frmDocumentoCadastro"></form>'), '')
})

test('árvore guardada de um processo de pagamento com Sicaf, Consulta e Anexo em branco (se existir no computador)', () => {
  const fs = require('node:fs')
  const caminho = require('node:path').join(__dirname, '../ferramentas-de-teste/paginas-sei/Pagina-Sicaf-em-branco_files/controlador_0_gb.html')
  if (!fs.existsSync(caminho)) return
  const { numero, documentos } = lerArvore(fs.readFileSync(caminho, 'latin1'))
  assert.equal(numero, '23236.023830/2025-11')
  // "Anexo Instrumento de Cobrança…" tem PDF e não conta.
  assert.deepEqual(documentosEmBranco(documentos).map(doc => doc.rotulo), ['Sicaf (3385221)', 'Consulta (3385222)', 'Anexo (3385223)'])
})
