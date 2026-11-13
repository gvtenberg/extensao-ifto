const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const simples = require('../comum/simples-nacional.js')
const { gerarPdf, larguraDoTexto, quebrarParagrafo } = require('../comum/pdf-texto.js')
const { nomeNaArvore } = require('../comum/sei.js')
const { cnpjMatriz, cnpjValido } = require('../comum/sicaf.js')
const PASTA = path.join(__dirname, '../ferramentas-de-teste/simples-nacional')

// v0.17.0: etapa 1 da consulta do Simples Nacional. Página de resultado resumida (mesma estrutura da
// página guardada em 13/11/2026), já com "Mais informações" carregado.
const PAGINA = `<html><body><div id="conteudoPage"><h4>Consulta Optantes</h4></div>
<div id="conteudo" class="row" style="padding:20px">
    <h5><strong>Data da consulta:</strong>  <span>13/11/2026 11:33:25</span></h5>
    <div class="panel panel-success"><div class="panel-heading"><h3 class="panel-title">Identificação do Contribuinte - CNPJ Matriz</h3></div>
        <div class="panel-body">
            CNPJ: <span class="spanValorVerde"> 14.159.957/0001-90</span><br>
            <input type="hidden" value="14159957000602" id="hdnCnpj">
            <span style="font-size:small;color:gray">A opção pelo Simples Nacional e/ou SIMEI abrange todos os estabelecimentos da empresa</span><br>
            <br>
            Nome Empresarial: <span class="spanValorVerde">HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.</span>
        </div></div>
    <div class="panel panel-success"><div class="panel-heading"><h3 class="panel-title">Situação Atual</h3></div>
        <div class="panel-body">
            Situação no Simples Nacional: <span class="spanValorVerde">NÃO optante pelo Simples Nacional</span> <br>
            Situação no SIMEI: <span class="spanValorVerde">NÃO enquadrado no SIMEI</span> <br>
        </div></div>
    <div><div style="margin-bottom:20px;">
            <button id="btnMaisInfo" class="btn btn-default"><span class="glyphicon glyphicon-plus"></span> Mais informações</button> <div class="loader" style="display:none"></div>
            <span id="spnMsgErro" style="color:red;display:none"></span></div>
        <div id="maisInfo" class="collapse in">
            <div class="panel panel-success"><div class="panel-heading"><h3 class="panel-title">Períodos Anteriores</h3></div>
                <div class="panel-body"><div id="periodosAnterioresSnSimei">Opções pelo Simples Nacional em Períodos Anteriores: <span class="spanValorVerde">Não Existem</span><br><br>Enquadramentos no SIMEI em Períodos Anteriores: <span class="spanValorVerde">Não Existem</span></div>
                    <br><span>Opções pelo Regime Regular IBS/CBS em Períodos Anteriores: </span>
                            <span class="spanValorVerde">Não Existem</span></div></div>
            <div id="maisInfoComplementar"><div class="panel panel-success"><div class="panel-heading"><h3 class="panel-title">Eventos Futuros (Simples Nacional)</h3></div><div class="panel-body"><span class="spanValorVerde">Não Existem</span></div></div></div>
        </div></div>
    <div class="row"><a class="btn btn-verde" href="https://consopt.www8.receita.fazenda.gov.br/consultaoptantes">Voltar</a>
        <button id="GerarPDF" class="btn btn-verde">Gerar PDF</button></div>
</div><!-- Modal Nao Optante <div>Instruções</div> --><footer></footer></body></html>`

async function textoDoPdf (bytes) {
  globalThis.pdfjsWorker = await import(pathToFileURL(path.join(__dirname, '../bibliotecas/pdfjs/pdf.worker.min.mjs')).href)
  const pdfjs = await import(pathToFileURL(path.join(__dirname, '../bibliotecas/pdfjs/pdf.min.mjs')).href)
  const documento = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, disableFontFace: true, verbosity: 0 }).promise
  let saida = ''
  for (let n = 1; n <= documento.numPages; n++) saida += (await (await documento.getPage(n)).getTextContent()).items.map(item => item.str + (item.hasEOL ? '\n' : '')).join('') + '\n'
  return { saida, paginas: documento.numPages }
}

test('Simples Nacional: lê o resultado na ordem da página', () => {
  const r = simples.lerResultado(PAGINA)
  assert.equal(r.valido, true)
  assert.equal(r.cnpj, '14159957000190')
  assert.equal(r.dataDaConsulta, '13/11/2026 11:33:25')
  assert.equal(r.nomeEmpresarial, 'HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.')
  assert.equal(r.situacaoSimples, 'NÃO optante pelo Simples Nacional')
  assert.equal(r.situacaoSimei, 'NÃO enquadrado no SIMEI')
  assert.equal(r.comMaisInformacoes, true)
  assert.deepEqual(r.linhas.filter(l => l.secao).map(l => l.secao), ['Identificação do Contribuinte - CNPJ Matriz', 'Situação Atual', 'Períodos Anteriores', 'Eventos Futuros (Simples Nacional)'])
  const textos = r.linhas.filter(l => l.partes).map(l => l.partes.map(p => p.texto).join(' '))
  assert.ok(textos.includes('Opções pelo Regime Regular IBS/CBS em Períodos Anteriores: Não Existem'))
  assert.ok(!textos.some(t => /Mais informações|Voltar|Gerar PDF|Instruções/.test(t)))
  assert.equal(r.linhas.find(l => l.rotulo === 'CNPJ').partes[1].negrito, true)
  assert.equal(r.linhas.find(l => /abrange/.test(l.valor)).nota, true)
})

test('Simples Nacional: página sem resultado ou sem "Mais informações"', () => {
  assert.equal(simples.lerResultado('<html><body><form id="consultarForm"></form></body></html>').valido, false)
  const semMais = PAGINA.slice(0, PAGINA.indexOf('<div id="maisInfoComplementar">')) + '<div id="maisInfoComplementar"> </div></div></div></div></body></html>'
  assert.equal(simples.lerResultado(semMais).valido, true)
  assert.equal(simples.lerResultado(semMais).comMaisInformacoes, false)
})

test('Simples Nacional: nome do arquivo, nome na árvore e linha da fonte', () => {
  const agora = new Date(2026, 10, 13, 9, 5)
  assert.equal(simples.nomeDoArquivo('14.159.957/0006-02', agora), 'ConsultaOptantes_14159957000602_2026-11-13.pdf')
  const nome = simples.nomeDaConsulta('HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.')
  assert.equal(nome, 'Simples Nacional HM COMERCIO IMPORTACAO E')
  assert.ok(nome.length <= 50)
  assert.equal(simples.nomeDaConsulta('CHC LTDA.'), 'Simples Nacional CHC LTDA')
  assert.equal(simples.linhaDaFonte(agora), 'Consulta feita em 13/11/2026 09:05 no Portal do Simples Nacional (https://consopt.www8.receita.fazenda.gov.br/consultaoptantes).')
})

test('nomeNaArvore (comum/sei.js): até 50 letras, corta na palavra e tira o ponto do fim', () => {
  assert.equal(nomeNaArvore('  Curto  demais '), 'Curto demais')
  assert.equal(nomeNaArvore('x'.repeat(60)).length, 50)
  assert.equal(nomeNaArvore('Anexo ' + 'palavra '.repeat(6) + 'fim.'), 'Anexo palavra palavra palavra palavra palavra')
  assert.equal(nomeNaArvore('a'.repeat(45) + ' bb, cccccc'), 'a'.repeat(45) + ' bb')
})

test('cnpjMatriz: filial vira matriz (0001) com dígitos refeitos', () => {
  assert.equal(cnpjMatriz('14.159.957/0006-02'), '14159957000190')
  assert.equal(cnpjMatriz('10742006000350'), '10742006000198')
  assert.equal(cnpjValido(cnpjMatriz('10742006000350')), true)
  assert.equal(cnpjMatriz('123'), null)
})

test('PDF de texto: quebra linhas pela largura da letra', () => {
  assert.equal(larguraDoTexto('a', 10, false), 5.56)
  assert.equal(larguraDoTexto('ã', 10, false), larguraDoTexto('a', 10, false))
  const linhas = quebrarParagrafo({ partes: [{ texto: 'Rótulo:' }, { texto: 'palavra '.repeat(40), negrito: true }] }, 200)
  assert.ok(linhas.length > 1)
  assert.deepEqual(linhas[0].map(p => p.negrito), [false, true])
})

test('PDF de texto: CNPJ e acentos podem ser procurados no PDF', async () => {
  const r = simples.lerResultado(PAGINA)
  const bytes = gerarPdf(simples.paragrafosDoPdf(r, new Date(2026, 10, 13, 11, 34)), { titulo: 'Consulta Optantes' })
  assert.equal(String.fromCharCode(...bytes.slice(0, 8)), '%PDF-1.4')
  const { saida, paginas } = await textoDoPdf(bytes)
  assert.equal(paginas, 1)
  for (const esperado of ['Consulta Optantes – Simples Nacional', 'CNPJ: 14.159.957/0001-90', 'Nome Empresarial: HM COMERCIO IMPORTACAO E EXPORTACAO LTDA.', 'Situação no Simples Nacional: NÃO optante pelo Simples Nacional', 'Eventos Futuros (Simples Nacional)', 'Consulta feita em 13/11/2026 11:34']) {
    assert.ok(saida.includes(esperado), esperado)
  }
})

test('PDF de texto: texto comprido passa para a página seguinte', async () => {
  const paragrafos = Array.from({ length: 80 }, (_, i) => ({ texto: `Linha ${i + 1} (com parênteses) e barra \\` }))
  const { saida, paginas } = await textoDoPdf(gerarPdf(paragrafos))
  assert.equal(paginas, 2)
  assert.ok(saida.includes('Linha 80 (com parênteses) e barra \\'))
})

// Página guardada no computador: gera um PDF de exemplo para abrir e procurar o CNPJ (Ctrl+F).
test('página guardada do Simples Nacional: PDF de exemplo (se existir no computador)', async () => {
  const caminho = path.join(PASTA, 'Simples Nacional2_files/ConsultarCnpj_ZwC_.html')
  if (!fs.existsSync(caminho)) return
  const r = simples.lerResultado(fs.readFileSync(caminho, 'utf8'))
  assert.equal(r.valido, true)
  assert.equal(r.cnpj, '14159957000190')
  const bytes = gerarPdf(simples.paragrafosDoPdf(r, new Date(2026, 10, 13, 11, 34)), { titulo: 'Consulta Optantes' })
  fs.writeFileSync(path.join(PASTA, 'exemplo-' + simples.nomeDoArquivo(r.cnpj, new Date(2026, 10, 13))), bytes)
  assert.ok((await textoDoPdf(bytes)).saida.includes('14.159.957/0001-90'))
})
