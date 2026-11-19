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
  assert.deepEqual(c.avisosDoTimbre(r), ['Falta a linha "Campus Palmas".', 'Falta a linha "Diretoria de Administração e Planejamento".', 'Falta a linha "Coordenação de Gestão Orçamentária e Contratos".', 'A linha "Reitoria" não é desta unidade.'])
  // unidade sem cadastro: só as fixas e "Reitoria" contam
  const sem = c.conferirTimbre([{ nome: 'a', html: cab([...FIXO, 'Campus Palmas', 'Gerência X']) }], null, 'X/PAL/REI/IFTO')
  assert.equal(sem.certo, true)
  // D14: Gabinete sem cadastro
  const gab = c.conferirTimbre([{ nome: 'a', html: cab([...FIXO, 'Campus Palmas']) }], null, 'PAL/REI/IFTO')
  assert.deepEqual(gab.faltam, ['Gabinete da Direção-Geral'])
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
