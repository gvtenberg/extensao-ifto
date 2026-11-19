const { test } = require('node:test')
const assert = require('node:assert/strict')
const r = require('../comum/copia-editor.js')

// v0.31.0 (spec copia-editor-sei)
test('número do documento vem do endereço do editor', () => {
  assert.equal(r.idDoEndereco('https://sei.ifto.edu.br/sei/controlador.php?acao=editor_montar&id_procedimento=3365963&id_documento=3662458&infra_sistema=1'), '3662458')
  assert.equal(r.idDoEndereco('https://sei.ifto.edu.br/sei/controlador.php?acao=procedimento_trabalhar'), '')
  assert.equal(r.chave('3662458'), 'copiaEditor:3662458')
})

test('mesmo conteúdo: texto igual e comentários iguais, em qualquer ordem e sem os campos de tela', () => {
  const c1 = { id: 'A', texto: '<p>x</p>', inicioPosicao: 1, inicioDeslocamento: 0, fimPosicao: 1, fimDeslocamento: 3 }
  const c2 = { id: 'B', texto: '<p>y</p>', inicioPosicao: 2, inicioDeslocamento: 0, fimPosicao: 2, fimDeslocamento: 1 }
  const a = { secoes: { s1: '<p>Um</p>', s2: '<p>Dois</p>' }, comentarios: [c1, c2] }
  assert.equal(r.mesmoConteudo(a, { secoes: { s2: '<p>Dois</p>', s1: '<p>Um</p>' }, comentarios: [{ ...c2, visivel: true }, c1] }), true)
  assert.equal(r.mesmoConteudo(a, { secoes: { s1: '<p>Um</p>', s2: '<p>Dois!</p>' }, comentarios: [c1, c2] }), false)
  assert.equal(r.mesmoConteudo(a, { secoes: a.secoes, comentarios: [c1] }), false)
  assert.equal(r.mesmoConteudo(a, { secoes: { s1: '<p>Um</p>' }, comentarios: [c1, c2] }), false)
  assert.equal(r.mesmoConteudo(a, null), false)
})

test('cópias vencidas: mais de 7 dias; liberar espaço começa pela mais antiga, nunca a do documento aberto', () => {
  const agora = Date.UTC(2026, 10, 19)
  const dia = 86400000
  const indice = { 1: agora - 8 * dia, 2: agora - 6 * dia, 3: agora - dia, 4: agora - 10 * dia }
  assert.deepEqual(r.vencidas(indice, agora).sort(), ['1', '4'])
  assert.deepEqual(r.maisAntigas(indice, '4'), ['1', '2', '3'])
})

test('outra janela do mesmo documento: viva só se deu sinal há menos de 70 s', () => {
  const agora = 1000000
  assert.equal(r.janelaViva({ janela: 'b', vivo: agora - 30000 }, 'a', agora), true)
  assert.equal(r.janelaViva({ janela: 'b', vivo: agora - 80000 }, 'a', agora), false)
  assert.equal(r.janelaViva({ janela: 'a', vivo: agora }, 'a', agora), false)
  assert.equal(r.janelaViva(undefined, 'a', agora), false)
})

test('hora da cópia: "hoje às" ou a data', () => {
  const agora = new Date(2026, 10, 19, 15, 0).getTime()
  assert.equal(r.quando(new Date(2026, 10, 19, 10, 42).getTime(), agora), 'hoje às 10:42')
  assert.equal(r.quando(new Date(2026, 10, 18, 9, 5).getTime(), agora), '18/11/2026 às 09:05')
})

test('diferenças: parágrafo novo, removido, mudado e só de formatação', () => {
  const sei = '<p>Um</p><p>Dois</p><p>Três</p><p class="a">Quatro</p><p>Cinco</p>'
  const copia = '<p>Um</p><p>Dois mudado</p><p>Três</p><p class="b">Quatro</p><p>Cinco</p><p>Seis</p>'
  const lista = r.diferencas(sei, copia)
  assert.deepEqual(lista.map(d => [d.tipo, d.numero, d.antes, d.depois, d.soFormatacao]), [
    ['mudado', 2, 'Dois', 'Dois mudado', false],
    ['mudado', 4, 'Quatro', 'Quatro', true],
    ['novo', 6, '', 'Seis', false]
  ])
  assert.deepEqual(r.diferencas('<p>A</p><p>B</p>', '<p>A</p>').map(d => [d.tipo, d.numero, d.antes]), [['removido', 2, 'B']])
  assert.deepEqual(r.diferencas('<p>A</p>', '<p>A</p>'), [])
})

test('diferenças: tabela conta cada célula, sem repetir o parágrafo de dentro', () => {
  const blocos = r.paragrafos('<p>Antes</p><table><tr><td><p>c1</p></td><td>c2</td></tr></table>')
  assert.deepEqual(blocos.map(b => b.texto), ['Antes', 'c1', 'c2'])
})
