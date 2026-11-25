const { test } = require('node:test')
const assert = require('node:assert/strict')
const d = require('../comum/dados-processo.js')

// v0.33.0: página "Consultar/Alterar Processo" (mesmos campos do Iniciar Processo).
const PAGINA = '<form id="frmProcedimentoCadastro"><select id="selTipoProcedimento" name="selTipoProcedimento"><option value="null">&nbsp;</option>' +
  '<option value="100000316" selected="selected">Gest&atilde;o de Contrato: Acompanhamento da Execu&ccedil;&atilde;o</option></select>' +
  '<input type="text" id="txtDescricao" name="txtDescricao" value="Contrato n&ordm; 27/2026 - C2A" tabindex="502">' +
  '<select id="selInteressadosProcedimento" multiple="multiple"><option value="1">Campus Palmas</option><option value="2">C2A SERVICOS</option></select>' +
  '<input type="hidden" id="hdnProtocoloFormatado" value="23236.023326/2026-94"><input type="hidden" id="hdnDtaGeracao" value="12/08/2026"></form>'

test('lê Tipo, Especificação, Interessados e Data de Autuação da página do processo', () => {
  assert.deepEqual(d.lerDados(PAGINA), {
    processo: '23236.023326/2026-94',
    tipo: 'Gestão de Contrato: Acompanhamento da Execução',
    especificacao: 'Contrato nº 27/2026 - C2A',
    interessados: ['Campus Palmas', 'C2A SERVICOS'],
    autuacao: '12/08/2026'
  })
  assert.equal(d.lerDados('<p>outra página</p>'), null)
})

test('link da página dos dados: Alterar ou, sem permissão, Consultar', () => {
  assert.equal(d.linkDosDados('<a href="controlador.php?acao=procedimento_alterar&amp;id_procedimento=3&amp;infra_hash=ab">'), 'controlador.php?acao=procedimento_alterar&id_procedimento=3&infra_hash=ab')
  assert.equal(d.linkDosDados('<a href="controlador.php?acao=procedimento_consultar&amp;id_procedimento=3">'), 'controlador.php?acao=procedimento_consultar&id_procedimento=3')
  assert.equal(d.linkDosDados('<a href="controlador.php?acao=documento_alterar">'), '')
})

test('guarda só os últimos processos vistos', () => {
  let guardados = {}
  for (let i = 0; i < d.GUARDADOS + 5; i++) guardados = d.guardar(guardados, { processo: 'P' + i }, new Date(2026, 10, 1, 0, i))
  assert.equal(Object.keys(guardados).length, d.GUARDADOS)
  assert.ok(guardados['P' + (d.GUARDADOS + 4)])
  assert.ok(!guardados.P0)
})

const CAPA = '<p class="Texto_Justificado"><strong>Processo:</strong>&nbsp;23236.016968/2026-37 &nbsp; <strong>Data de Autuação:</strong>&nbsp; 12/08/2026</p><p class="Texto_Justificado"><br></p>' +
  '<p class="Texto_Justificado"><strong>Tipo de Processo:</strong>&nbsp;Gestão de Contrato: Processo de Pagamento</p><p class="Texto_Justificado"><br></p>' +
  '<p class="Texto_Justificado"><strong>Especificação:</strong>&nbsp;Contrato nº 27/2026 - C2A</p><p class="Texto_Justificado"><br></p>' +
  '<p class="Texto_Justificado"><strong>Classificação por Assunto(s):</strong>&nbsp;004</p><p class="Texto_Justificado"><br></p>' +
  '<p class="Texto_Justificado"><strong>Interessado(s):</strong>&nbsp;<i>Campus </i>Palmas</p><p class="Texto_Justificado"><br></p>'

test('Capa de Processo: confere com os dados do processo e corrige só o que está diferente', () => {
  const capa = d.lerCapa([{ nome: 'Corpo', html: CAPA }])
  assert.equal(capa.tipo, 'Gestão de Contrato: Processo de Pagamento')
  assert.deepEqual(capa.interessados, ['Campus Palmas'])
  const dados = d.lerDados(PAGINA)
  const conferido = d.conferirCapa(capa, dados)
  assert.deepEqual(conferido.diferencas.map(item => item.campo), ['tipo', 'interessados'])
  assert.match(d.avisosDaCapa(conferido)[0], /^Tipo de Processo: a capa diz "Gestão de Contrato: Processo de Pagamento", mas o processo tem/)
  const novo = d.corrigirCapa(CAPA, dados, conferido)
  assert.ok(novo.includes('<p class="Texto_Justificado"><strong>Interessado(s):</strong>&nbsp;Campus Palmas; C2A SERVICOS</p>'))
  assert.equal(d.conferirCapa(d.lerCapa([{ nome: 'Corpo', html: novo }]), dados).certo, true)
  assert.equal(d.lerCapa([{ nome: 'Corpo', html: '<p>Processo nº: 1</p>' }]), null)
})

test('Capa: interessados na mesma linha ou um por linha valem; a correção junta tudo numa linha (v0.36.2)', () => {
  const dados = { ...d.lerDados(PAGINA), tipo: 'Gestão de Contrato: Processo de Pagamento', interessados: ['Campus Palmas', 'Fundação - FAPTO', 'Professor X - Deputado'] }
  const com = linhas => CAPA.replace('<i>Campus </i>Palmas</p>', linhas + '</p>')
  const certo = html => d.conferirCapa(d.lerCapa([{ nome: 'Corpo', html }]), dados).certo
  assert.equal(certo(com('Campus Palmas; Fundação - FAPTO; Professor X - Deputado')), true)
  assert.equal(certo(com('Campus Palmas</p><p>Fundação - FAPTO</p><p>Professor X - Deputado')), true)
  const antiga = com('Campus Palmas</p><p>Outro')
  const novo = d.corrigirCapa(antiga, dados, d.conferirCapa(d.lerCapa([{ nome: 'Corpo', html: antiga }]), dados))
  assert.ok(novo.includes('&nbsp;Campus Palmas; Fundação - FAPTO; Professor X - Deputado</p>'))
  assert.ok(!novo.includes('Outro'))
  assert.equal(certo(novo), true)
})

test('Capa: Data de Autuação diferente é trocada na mesma linha do número', () => {
  const dados = { ...d.lerDados(PAGINA), tipo: 'Gestão de Contrato: Processo de Pagamento', interessados: ['Campus Palmas'], autuacao: '01/09/2026' }
  const conferido = d.conferirCapa(d.lerCapa([{ nome: 'Corpo', html: CAPA }]), dados)
  assert.deepEqual(conferido.diferencas.map(item => item.campo), ['autuacao'])
  const novo = d.corrigirCapa(CAPA, dados, conferido)
  assert.ok(novo.includes('<strong>Data de Autuação:</strong>&nbsp; 01/09/2026'))
  assert.ok(novo.includes('23236.016968/2026-37'))
})
