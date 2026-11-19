// Lê o TESTES-PENDENTES.md e monta o cartão (issue) do GitHub de cada teste (T..) e pergunta (P..).
// Formato compacto (só para os cartões): "## seção", "> antes" (opcional), "### T08 – título",
// "F:" (o que fazer), "E:" (o que deve acontecer), "?:" (pergunta).
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
    else if (secao && !s) introducao.push(linha.replace(/^>\s?/, ''))
  }
  if (atual) itens.push(atual)
  return itens.map(({ linhas, ...item }) => ({ ...item, texto: linhas.join('\n').trim() }))
}

const ROTULOS = { 'F:': '**O que fazer:**', 'E:': '**O que deve acontecer:**', '?:': '**Pergunta:**' }

// Corpo do cartão: o texto do teste, com os rótulos por extenso, e as caixinhas.
function corpoDoCartao (item) {
  const texto = item.texto.split('\n')
    .map(l => ROTULOS[l.slice(0, 2)] ? ROTULOS[l.slice(0, 2)] + ' ' + l.slice(2).trim() + '\n' : l)
    .join('\n').trim()
  const pergunta = item.numero.startsWith('P')
  return [
    `**Seção:** ${item.secao}`,
    item.antes ? '\n> ' + item.antes.split('\n').join('\n> ') : '',
    '',
    texto,
    '',
    '---',
    pergunta
      ? '**Como responder:** escreva a resposta num comentário abaixo.'
      : [
          '**Como responder:** faça o teste e clique numa caixinha. Se falhou ou tiver sugestão, escreva num comentário abaixo o que fez e o que apareceu.',
          '',
          '- [ ] ✅ Passou',
          '- [ ] ❌ Falhou',
          '',
          '_Sem permissão para clicar? Escreva "passou" ou "falhou" no comentário._'
        ].join('\n'),
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

// Apaga do arquivo os blocos dos números indicados (para o /testes, sem ler o arquivo inteiro).
// Seção que fica sem testes sai também.
function apagarTestes (texto, numeros) {
  const apagar = new Set(numeros)
  const saida = []
  let pulando = false
  for (const linha of texto.split('\n')) {
    const t = /^### ([TP]\d+) /.exec(linha)
    if (t) pulando = apagar.has(t[1])
    else if (/^## /.test(linha)) pulando = false
    if (!pulando) saida.push(linha)
  }
  return saida.join('\n')
    .replace(/^## [^\n]*\n(?:>[^\n]*\n)?\n*(?=## |$)/gm, '') // seção vazia
    .replace(/\n{3,}/g, '\n\n')
}

// 18/11/2026: o cartão de um teste é o que tem o mesmo número E o mesmo título. Número igual com outro título
// (ex.: teste do colega com número que o dono também usou) não é teste repetido: ganha cartão também, marcado
// como "número repetido", para ninguém perder o teste. Fecha os cartões abertos cujo teste (número + título)
// saiu do arquivo.
const tituloDoCartao = cartao => cartao.title.replace(/^[TP]\d+\s*[–-]\s*/, '').trim()
function planoDosCartoes (itens, cartoes) {
  const chave = (numero, titulo) => numero + '|' + titulo.trim()
  const comCartao = new Set(cartoes.map(c => chave(numeroDoCartao(c), tituloDoCartao(c))))
  const numerosComCartao = new Set(cartoes.map(numeroDoCartao))
  const noArquivo = new Set(itens.map(i => chave(i.numero, i.titulo)))
  const criar = itens.filter(i => !comCartao.has(chave(i.numero, i.titulo)))
    .map(item => ({ item, numeroRepetido: numerosComCartao.has(item.numero) || itens.filter(i => i.numero === item.numero).length > 1 }))
  const fechar = cartoes.filter(c => c.state === 'open' && numeroDoCartao(c) && !noArquivo.has(chave(numeroDoCartao(c), tituloDoCartao(c))))
  return { criar, fechar }
}

module.exports = { apagarTestes, lerTestes, corpoDoCartao, resultadoDoCartao, numeroDoCartao, planoDosCartoes }
