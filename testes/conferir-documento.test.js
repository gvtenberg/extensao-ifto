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
  assert.equal(c.fraseDoProcesso({ processo: '23236.018761/2026-05', escrito: '23236.000001/2025-11' }),
    'Número do processo: o documento está no processo 23236.018761/2026-05, mas o texto diz 23236.000001/2025-11.')
  assert.equal(c.perguntaAntesDeAssinar(['a']), 'Este documento tem uma possível divergência. Assinar mesmo assim?')
  assert.equal(c.perguntaAntesDeAssinar(['a', 'b']), 'Este documento tem possíveis divergências. Assinar mesmo assim?')
})

test('v0.26.9: antes de assinar, número do processo e data errada (não a data só fora do padrão)', () => {
  const hoje = new Date(2026, 10, 18)
  const ref = '<p>Referência: Processo nº 23236.018761/2026-05</p>'
  const doc = (processo, data) => `<p>Palmas, ${data}.</p><p>Processo nº: ${processo}</p><p>Texto</p>` + ref
  const tudo = { conferirProcesso: true, conferirData: true }
  assert.deepEqual(c.problemasParaAssinar(doc('23236.018761/2026-05', '18 de novembro de 2026'), tudo, hoje), [])
  assert.deepEqual(c.problemasParaAssinar(doc('23236.018761/2026-05', '18 de Novembro de 2026'), tudo, hoje), [])
  const dois = c.problemasParaAssinar(doc('23236.000001/2025-11', '18 de outubro de 2026'), tudo, hoje)
  assert.equal(dois.length, 2)
  assert.match(dois[1], /^Data: o texto diz 18 de outubro de 2026/)
  assert.equal(c.problemasParaAssinar(doc('23236.000001/2025-11', '18 de outubro de 2026'), { conferirData: true }, hoje).length, 1)
  const assinado = doc('23236.018761/2026-05', '18 de outubro de 2026') + '<p>Documento assinado eletronicamente por Fulano</p>'
  assert.deepEqual(c.problemasParaAssinar(assinado, tudo, hoje), [])
  // v0.34.2: documento já assinado também não tem o número do processo conferido.
  assert.deepEqual(c.problemasParaAssinar(assinado.replace('Processo nº: 23236.018761/2026-05', 'Processo nº: 23236.000001/2025-11'), tudo, hoje), [])
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

// v0.26.5: timbre e rodapé, como nas páginas salvas (Despacho 67/2026/CGOC, Folha de encaminhamento).
const cab = linhas => '<p class="IFTO_Cabe&ccedil;alho_"><img src="x"></p>' + linhas.map(l => '<p class="IFTO_Cabe&ccedil;alho_Novo">' + l + '</p>').join('')
const FIXO = ['Minist&eacute;rio da Educa&ccedil;&atilde;o', 'Secretaria de Educa&ccedil;&atilde;o Profissional e Tecnol&oacute;gica', 'Instituto Federal de Educa&ccedil;&atilde;o, Ci&ecirc;ncia e Tecnologia do Tocantins']
const cgoc = { sigla: 'CGOC/PAL/REI/IFTO', telefone: '63 3236-4012', email: 'contratos.palmas@ifto.edu.br', linhas: ['Diretoria de Administração e Planejamento', 'Coordenação de Gestão Orçamentária e Contratos'] }

test('v0.26.5: timbre certo, com espaço duro e caracteres invisíveis', () => {
  const r = c.conferirTimbre([{ nome: 'a', html: cab([...FIXO, 'Campus&nbsp;Palmas', 'Diretoria de Administração e Planejamento⁠', 'Coordenação de Gestão Orçamentária e Contratos ']) }], cgoc, cgoc.sigla)
  assert.equal(r.certo, true)
  assert.equal(c.conferirTimbre([{ nome: 'a', html: '<p>sem timbre</p>' }], cgoc, cgoc.sigla), null)
})

test('v0.26.5: timbre com "Reitoria" e sem as linhas do setor (D12)', () => {
  const r = c.conferirTimbre([{ nome: 'a', html: cab([...FIXO, 'Reitoria']) }], cgoc, cgoc.sigla)
  assert.equal(r.certo, false)
  assert.deepEqual(c.avisosDoTimbre(r), ['Falta a linha "Campus Palmas".', 'Falta a linha "Diretoria de Administração e Planejamento".', 'Falta a linha "Coordenação de Gestão Orçamentária e Contratos".'])
  // unidade sem cadastro: só as fixas e "Reitoria" contam
  const sem = c.conferirTimbre([{ nome: 'a', html: cab([...FIXO, 'Campus Palmas', 'Gerência X']) }], null, 'X/PAL/REI/IFTO')
  assert.equal(sem.certo, true)
  // D14: Gabinete sem cadastro
  const gab = c.conferirTimbre([{ nome: 'a', html: cab([...FIXO, 'Campus Palmas']) }], null, 'PAL/REI/IFTO')
  assert.deepEqual(gab.faltam, ['Gabinete da Direção-Geral'])
})

test('v0.34.2: "Reitoria" no timbre não é divergência e fica no lugar ao corrigir', () => {
  const certo = [...FIXO, 'Reitoria', 'Campus Palmas', ...cgoc.linhas]
  assert.equal(c.conferirTimbre([{ nome: 'a', html: cab(certo) }], cgoc, cgoc.sigla).certo, true)
  assert.equal(c.conferirTimbre([{ nome: 'a', html: cab(certo) }], null, 'X/PAL/REI/IFTO').certo, true)
  // "Reitoria" digitada em "Minhas unidades": também vale o timbre sem ela.
  const comReitoria = { ...cgoc, linhas: ['Reitoria', ...cgoc.linhas] }
  assert.equal(c.conferirTimbre([{ nome: 'a', html: cab([...FIXO, 'Campus Palmas', ...cgoc.linhas]) }], comReitoria, cgoc.sigla).certo, true)
  assert.equal(c.conferirTimbre([{ nome: 'a', html: cab(certo) }], comReitoria, cgoc.sigla).certo, true)
  // Outra divergência: corrige só ela e mantém "Reitoria".
  const r = c.conferirTimbre([{ nome: 'a', html: cab([...FIXO, 'Reitoria', 'Campus Palmas', 'Gerência X']) }], cgoc, cgoc.sigla)
  assert.equal(r.certo, false)
  assert.ok(!c.avisosDoTimbre(r).some(aviso => aviso.includes('Reitoria')))
  assert.deepEqual(r.esperado.slice(2, 5), ['Instituto Federal de Educação, Ciência e Tecnologia do Tocantins', 'Reitoria', 'Campus Palmas'])
})

test('v0.26.5: corrigir o timbre mantém o brasão e a classe', () => {
  const r = c.conferirTimbre([{ nome: 'a', html: cab([...FIXO, 'Reitoria']) }], cgoc, cgoc.sigla)
  const novo = c.corrigirTimbre(cab([...FIXO, 'Reitoria']), r.esperado)
  assert.ok(novo.startsWith('<p class="IFTO_Cabe&ccedil;alho_"><img src="x"></p><p class="IFTO_Cabe&ccedil;alho_Novo">Ministério da Educação</p>'))
  assert.equal(c.conferirTimbre([{ nome: 'a', html: novo }], cgoc, cgoc.sigla).certo, true)
  assert.deepEqual(c.linhasDoSetor([{ html: cab([...FIXO, 'Reitoria', 'Campus Palmas', 'Gerência X']) }]), ['Gerência X'])
})

const rodape = texto => '<p class="IFTO_Centralizado_rodape" style="margin: 0px">' + texto + '</p>'
test('v0.26.5: rodapé conferido só pelos dados (D11)', () => {
  const certo = rodape('Quadra 310 Sul, Lo 5, s/n, Avenida NS 10 - Plano Diretor Sul&nbsp;&mdash; CEP 77.021-090<br>Palmas/TO &mdash; (63) 3236-4012<br>portal.ifto.edu.br/palmas &mdash; contratos.palmas@ifto.edu.br')
  assert.equal(c.conferirRodape([{ nome: 'r', html: certo }], cgoc).certo, true)
  const reitoria = rodape('Quadra 310 Sul, Lo 5, s/n, esquina com a Avenida NS 10 - Plano Diretor Sul — CEP Palmas/TO — (63) 3236-4000<br>portal.ifto.edu.br — reitoria@ifto.edu.br')
  assert.deepEqual(c.conferirRodape([{ nome: 'r', html: reitoria }], cgoc).avisos, ['O CEP deve ser 77021-090.', 'Telefone 63 3236-4000: o certo é 63 3236-4012.', 'E-mail reitoria@ifto.edu.br: o certo é contratos.palmas@ifto.edu.br.'])
  // sem cadastro: telefone e e-mail gerais do campus
  assert.deepEqual(c.conferirRodape([{ nome: 'r', html: reitoria }], null).avisos, ['O CEP deve ser 77021-090.', 'E-mail reitoria@ifto.edu.br: o certo é palmas@ifto.edu.br.'])
  assert.equal(c.conferirRodape([{ nome: 'r', html: '<p>x</p>' }], null), null)
})

test('v0.26.7: sem cadastro, telefone e e-mail de qualquer setor do campus estão certos (T142)', () => {
  const gise = rodape('Quadra 310 Sul, Lo 5, s/n, Avenida NS 10 - Plano Diretor Sul — CEP 77021-090<br>Palmas/TO — 63 3236-4023<br>palmas.ifto.edu.br — gise.palmas@ifto.edu.br')
  assert.equal(c.conferirRodape([{ nome: 'r', html: gise }], null).certo, true)
  assert.equal(c.conferirRodape([{ nome: 'r', html: gise }], { sigla: 'X' }).certo, true)
  // com cadastro, confere com o cadastrado
  assert.deepEqual(c.conferirRodape([{ nome: 'r', html: gise }], cgoc).avisos, ['Telefone 63 3236-4023: o certo é 63 3236-4012.', 'E-mail gise.palmas@ifto.edu.br: o certo é contratos.palmas@ifto.edu.br.'])
  // fora do campus continua errado
  const fora = rodape('Quadra 310 Sul, Lo 5, s/n, Avenida NS 10 - Plano Diretor Sul — CEP 77021-090<br>Palmas/TO — 63 3236-4100<br>palmas.ifto.edu.br — gise.paraiso@ifto.edu.br')
  // corrigir sem cadastro mantém o telefone e o e-mail do setor
  const semCep = gise.replace('CEP 77021-090', 'CEP')
  const corrigido = c.corrigirRodape(semCep, null)
  assert.ok(corrigido.includes('63 3236-4023') && corrigido.includes('gise.palmas@ifto.edu.br') && corrigido.includes('77021-090'))
  assert.deepEqual(c.conferirRodape([{ nome: 'r', html: fora }], null).avisos, ['Telefone 63 3236-4100: o certo é 63 3236-4000.', 'E-mail gise.paraiso@ifto.edu.br: o certo é palmas@ifto.edu.br.'])
})

test('v0.26.5: rodapé corrigido com o texto do D4 e os links', () => {
  const novo = c.corrigirRodape(rodape('velho') + rodape('segunda linha'), cgoc)
  assert.equal(novo, '<p class="IFTO_Centralizado_rodape" style="margin: 0px">Quadra 310 Sul, Lo 5, s/n, esquina com a Avenida NS 10 - Plano Diretor Sul — CEP 77021-090<br>Palmas/TO — <a href="tel:+556332364012">63 3236-4012</a><br><a href="https://palmas.ifto.edu.br">palmas.ifto.edu.br</a> — <a href="mailto:contratos.palmas@ifto.edu.br">contratos.palmas@ifto.edu.br</a></p>')
  assert.equal(c.conferirRodape([{ nome: 'r', html: novo }], cgoc).certo, true)
  assert.equal(c.formatarTelefone('+55 (63) 3236-4000'), '63 3236-4000')
})

test('v0.26.6: documentos do Bloco de assinatura (página salva do bloco 173213)', () => {
  const html = 'arrBloco[0]="173213"; arrLinkDocumento[0]="controlador.php?acao=documento_visualizar&id_documento=3533633&id_bloco=173213&infra_hash=ee"; arrLinkProcedimento[0]="controlador.php?acao=procedimento_trabalhar&id_documento=3533633"; arrLinkDocumento[1]="controlador.php?acao=documento_visualizar&amp;id_documento=3533700&id_bloco=173213";'
  assert.deepEqual(c.documentosDoBloco(html), [
    { id: '3533633', link: 'controlador.php?acao=documento_visualizar&id_documento=3533633&id_bloco=173213&infra_hash=ee' },
    { id: '3533700', link: 'controlador.php?acao=documento_visualizar&id_documento=3533700&id_bloco=173213' }])
  assert.equal(c.idDoItemDoBloco('3533633-173213'), '3533633')
  assert.equal(c.idDoItemDoBloco("infraLimparFormatarTrAcessada(this);acaoAssinar('3533633-173213');"), '3533633')
  assert.equal(c.idDoItemDoBloco('173213'), '')
})

// v0.33.0: Capa de Processo escreve "Processo:" sem o "nº".
test('linha "Processo:" sem o nº também é conferida (Capa de Processo)', () => {
  const secoes = [{ nome: 'Corpo', html: '<p class="Texto_Justificado"><strong>Processo:</strong>&nbsp;23236.016968/2026-37 &nbsp; <strong>Data de Autuação:</strong> 12/08/2026</p>' },
    { nome: 'Id Processo', html: '<td><strong>Referência:</strong> Processo nº 23236.023326/2026-94</td>', editavel: false }]
  const r = c.conferirProcesso(secoes)
  assert.equal(r.certo, false)
  assert.equal(r.escrito, '23236.016968/2026-37')
  assert.ok(c.corrigirProcesso(secoes[0].html, r.processo).includes('23236.023326/2026-94 &nbsp; <strong>Data de Autuação:</strong> 12/08/2026'))
  assert.equal(c.linhaDoProcesso([{ nome: 'x', html: '<p>Processo de Pagamento do Contrato 23236.016968/2026-37</p>' }]), null)
})

// v0.33.0 (pedido do usuário, 19/11/2026): palavra do timbre em minúscula e linhas em branco a mais.
test('timbre: palavra em minúscula (menos ligação e depois do hífen) e linhas em branco a mais', () => {
  assert.equal(c.comMaiusculas('Coordenação de Gestão orçamentária e Contratos'), 'Coordenação de Gestão Orçamentária e Contratos')
  assert.equal(c.comMaiusculas('Pró-reitoria de Ensino'), 'Pró-reitoria de Ensino')
  assert.equal(c.comMaiusculas('de Apoio'), 'De Apoio')
  const html = '<p class="IFTO_Cabeçalho_Novo"><img src="x"></p>' + [...FIXO, 'Campus Palmas', 'Diretoria de Administração e Planejamento'].map((linha, i) => `<p class="IFTO_Cabeçalho_Novo">${i === 1 ? '<br>' : ''}${linha}</p>`).join('') +
    '<p class="IFTO_Cabeçalho_Novo">Coordenação de Gestão orçamentária e Contratos</p><p class="IFTO_Cabeçalho_Novo">&nbsp;</p>'
  const r = c.conferirTimbre([{ nome: 'a', html }], cgoc, cgoc.sigla)
  assert.equal(r.certo, false)
  assert.equal(r.vazias, 2)
  assert.deepEqual(r.minusculas, [{ escrito: 'Coordenação de Gestão orçamentária e Contratos', certo: 'Coordenação de Gestão Orçamentária e Contratos' }])
  assert.deepEqual(c.avisosDoTimbre(r), ['A linha "Coordenação de Gestão orçamentária e Contratos" deve ser "Coordenação de Gestão Orçamentária e Contratos".', 'O timbre tem 2 linhas em branco a mais.'])
  const novo = c.corrigirTimbre(html, r.esperado)
  assert.ok(novo.includes('<img src="x">'))
  assert.equal(c.conferirTimbre([{ nome: 'a', html: novo }], cgoc, cgoc.sigla).certo, true)
})

// v0.35.2: "Campus"/"Campi" em itálico.
test('v0.35.2: Campus e Campi sem itálico', () => {
  const s = html => [{ nome: 'a', html }]
  assert.equal(c.conferirItalico(s('<p>o <i>Campus&nbsp;</i>Palmas e os <em>campi</em></p>')).certo, true)
  assert.equal(c.conferirItalico(s('<p><i><strong>Campus</strong></i> <span style="font-style:italic;">Campi</span></p><blockquote><p>Campus</p></blockquote>')).certo, true)
  assert.equal(c.conferirItalico(s('<p>CAMPUS PALMAS, campus.palmas@ifto.edu.br, https://ifto.edu.br/campus, intercampi</p><p class="Texto_Centralizado_Maiúsculas">Campus</p>')).certo, true)
  const r = c.conferirItalico(s('<p class="IFTO_Cabeçalho_Novo">Campus Palmas</p><p>no evento Campus Party, os campi e o<br>campus.</p>'))
  assert.equal(r.quantos, 4)
  assert.deepEqual(r.trechos.slice(0, 2), ['Campus Palmas', 'no evento Campus Party, os'])
  assert.equal(c.conferirItalico(s('<i>a <span style="font-style:normal">Campus</span></i>')).quantos, 1)
  assert.deepEqual(c.corrigirItalico([{ nome: 'a', html: '<style>.Campus{}</style><p title="Campus">do&nbsp;Campus Palmas</p>' }, { nome: 'b', html: '<p>Campus</p>', editavel: false }, { nome: 'c', html: '<p>x</p>' }]),
    { a: '<style>.Campus{}</style><p title="Campus">do&nbsp;<i>Campus</i> Palmas</p>' })
  assert.equal(c.conferirItalico([{ nome: 'b', html: '<p>Campus</p>', editavel: false }]).travados, 1)
})

test('v0.35.2: corrigir o timbre deixa Campus em itálico', () => {
  assert.equal(c.corrigirTimbre('<p class="IFTO_Cabeçalho_Novo">x</p>', ['Campus Palmas']), '<p class="IFTO_Cabeçalho_Novo"><i>Campus</i> Palmas</p>')
})

test('v0.35.2: cargo da diretora-geral, só na PAL/REI/IFTO', () => {
  const s = html => [{ nome: 'a', html }]
  const DG = 'PAL/REI/IFTO'
  const nome = 'NOEMI BARRETO&nbsp;SALES ZUKOWSKI'
  const certo = `<p>${nome}<br>Diretora-Geral do <i>Campus</i> Palmas</p>`
  assert.equal(c.conferirCargo(s(certo), DG).certo, true)
  assert.equal(c.conferirCargo(s(certo.replace('<br>', '</p><p>')), DG).certo, true)
  const casos = [
    `<p>${nome}<br>Diretora-Geral <i>Pro Tempore</i></p>`,
    `<p>${nome}</p><p>Diretora-geral</p><p>&nbsp;</p>`,
    `<p><strong>${nome}<br>Diretora-Geral</strong></p>`,
    `<p>${nome}<br><em>Diretora-Geral do Campus</em> Palmas</p>`,
    `<p>${nome}<br>Diretora-Geral do Campus Palmas</p>`,
    `<p>${nome}</p>`,
    `<p>${nome}</p><p>Outra frase.</p>`
  ]
  for (const html of casos.filter(caso => !caso.includes('<em>'))) {
    const errado = c.conferirCargo(s(html), DG)
    assert.equal(errado.certo, false, html)
    const novo = c.corrigirCargo(html, errado)
    assert.equal(c.conferirCargo(s(novo), DG).certo, true, novo)
    assert.equal(c.conferirItalico(s(novo)).certo, true, novo)
  }
  assert.equal(c.corrigirCargo(casos[0], c.conferirCargo(s(casos[0]), DG)), certo)
  assert.ok(c.corrigirCargo(casos[6], c.conferirCargo(s(casos[6]), DG)).endsWith('<p>Outra frase.</p>'))
  // Outra unidade, sem o nome ou nome no meio de uma frase: nada a conferir.
  assert.equal(c.conferirCargo(s(casos[0]), 'CGOC/PAL/REI/IFTO'), null)
  assert.equal(c.conferirCargo(s('<p>Outra Pessoa<br>Diretora-Geral</p>'), DG), null)
  assert.equal(c.conferirCargo(s('<p>A Noemi Barreto Sales Zukowski, Diretora-Geral Pro Tempore</p>'), DG), null)
  // Antes de assinar: o cargo pergunta, o itálico não; assinado não confere.
  const opcoes = { conferirCargo: true, conferirItalico: true }
  assert.equal(c.problemasParaAssinar(casos[0] + '<p>Campus</p>', opcoes, new Date(), DG).length, 1)
  assert.deepEqual(c.problemasParaAssinar(certo + '<p>Campus</p>', opcoes, new Date(), DG), [])
  assert.deepEqual(c.problemasParaAssinar(casos[0] + '<p>assinado eletronicamente por X</p>', opcoes, new Date(), DG), [])
})
