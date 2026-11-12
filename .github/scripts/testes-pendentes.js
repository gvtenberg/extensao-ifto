// Lê o TESTES-PENDENTES.md e monta o cartão (issue) do GitHub de cada teste (T..) e pergunta (P..).
// Usado pelo GitHub (testes-para-cartoes.js) e pelo /testes (ler-resultados.js). Sem dependências.
const MARCA = /<!-- teste:([TP]\d+) -->/

function lerTestes (texto) {
  const itens = []
  let secao = ''
  let introducao = [] // texto entre o "## seção" e o primeiro teste (ex.: o que fazer antes)
  let atual = null
  for (const linha of texto.split('\n')) {
    const s = /^## (.+)/.exec(linha)
    const t = /^### ([TP]\d+) [–-] (.+)/.exec(linha)
    if (s || t || /^---\s*$/.test(linha)) {
      if (atual) itens.push(atual)
      atual = null
    }
    if (s) { secao = s[1].trim(); introducao = [] }
    if (/^---\s*$/.test(linha)) { secao = ''; introducao = [] }
    if (t) atual = { numero: t[1], titulo: t[2].trim(), secao, antes: introducao.join('\n').trim(), linhas: [] }
    else if (atual) atual.linhas.push(linha)
    else if (secao && !s) introducao.push(linha)
  }
  if (atual) itens.push(atual)
  return itens.map(({ linhas, ...item }) => ({ ...item, texto: linhas.join('\n').trim() }))
}

// Corpo do cartão: o texto do teste (sem as linhas Resultado/Observação do arquivo) e as caixinhas.
function corpoDoCartao (item) {
  const texto = item.texto.split('\n').filter(l => !/^- (Resultado|Observação):/.test(l)).join('\n').trim()
  const pergunta = item.numero.startsWith('P')
  return [
    `**Seção:** ${item.secao}`,
    item.antes ? '\n> ' + item.antes.split('\n').join('\n> ') : '',
    '',
    texto,
    '',
    '---',
    pergunta
      ? '**Resposta:** escreva num comentário abaixo.'
      : '**Resultado** (clique numa caixinha):\n\n- [ ] ✅ Passou\n- [ ] ❌ Falhou\n\nO que aconteceu, observações e sugestões: escreva num comentário abaixo.',
    '',
    `<!-- teste:${item.numero} -->`
  ].join('\n')
}

// Do corpo do cartão (depois dos cliques do usuário): passou, falhou ou ainda não marcado.
function resultadoDoCartao (corpo) {
  const passou = /- \[x\] ✅ Passou/i.test(corpo || '')
  const falhou = /- \[x\] ❌ Falhou/i.test(corpo || '')
  if (passou && falhou) return 'as duas marcadas'
  if (passou) return 'passou'
  if (falhou) return 'falhou'
  return 'não marcado'
}

function numeroDoCartao (cartao) {
  const marca = MARCA.exec(cartao.body || '')
  if (marca) return marca[1]
  const titulo = /^([TP]\d+) /.exec(cartao.title || '')
  return titulo ? titulo[1] : null
}

module.exports = { lerTestes, corpoDoCartao, resultadoDoCartao, numeroDoCartao }
