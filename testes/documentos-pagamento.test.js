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
const { lerArvore, documentosEmBranco, acharOpcao, listaEmTexto, textoDaConfirmacao } = require('../comum/documentos-pagamento.js')
const arvore = [
  'Nos[0] = new infraArvoreNo("PROCESSO","3479546",null,"controlador.php?acao=arvore_visualizar","ifrVisualizacao","23236.012523/2026-88","Gestão","svg/processo.svg?25",null,null,true,true,null,null,null,null);',
  'Nos[1] = new infraArvoreNo("PASTA","PASTA2","3479546","javascript:abrirFecharPasta(\'PASTA2\')",null,"II","II",null,null,null,true,true,null,null,null);',
  'Nos[2] = new infraArvoreNo("DOCUMENTO","3497441","PASTA2","controlador.php?x","ifrConteudoVisualizacao","Documento CNH (3228999)","Documento CNH (3228999)","svg/documento_pdf.svg?25",null,null,true,true,null,null,null,null);',
  'Nos[3] = new infraArvoreNo("DOCUMENTO","3497536","PASTA2","controlador.php?x","ifrConteudoVisualizacao","Despacho 163 (3229092)","Despacho 163 (3229092)","svg/documento_interno.svg?25",null,null,true,true,null,null,null,null);',
  'Nos[4] = new infraArvoreNo("DOCUMENTO","3600001","PASTA2","controlador.php?x","ifrConteudoVisualizacao","Sicaf (3400001)","Sicaf (3400001)","svg/documento_generico.svg?25",null,null,true,true,null,null,null,null);',
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

test('texto da confirmação, com e sem avisos', () => {
  assert.equal(listaEmTexto(['Sicaf', 'Consulta', 'Anexo']), 'Sicaf, Consulta e Anexo')
  const simples = textoDaConfirmacao({ numero: '23236.012523/2026-88' })
  assert.match(simples, /^Incluir no processo 23236\.012523\/2026-88 os documentos externos em branco: Sicaf, Consulta e Anexo\?/)
  assert.doesNotMatch(simples, /ATENÇÃO/)
  const comAviso = textoDaConfirmacao({ numero: 'X', jaIncluidosHoje: true, emBranco: [{ rotulo: 'Sicaf (1)' }] })
  assert.match(comAviso, /já incluiu estes documentos neste processo hoje/)
  assert.match(comAviso, /sem arquivo: Sicaf \(1\)\./)
})
