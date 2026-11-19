// Para o /testes no computador de desenvolvimento: mostra, em poucas linhas, o que o usuário marcou
// nos cartões de teste do GitHub (repositório público: não precisa de senha). Comando:
//   node .github/scripts/ler-resultados.js
const fs = require('node:fs')
const { resultadoDoCartao, numeroDoCartao, lerTestes } = require('./testes-pendentes.js')
const api = 'https://api.github.com/repos/gvtenberg/extensao-ifto'
const cabecalhos = { Accept: 'application/vnd.github+json', 'User-Agent': 'extensao-ifto-testes' }

async function obter (caminho) {
  const resposta = await fetch(api + caminho, { headers: cabecalhos })
  if (!resposta.ok) throw new Error(`${caminho}: ${resposta.status} ${await resposta.text()}`)
  return resposta.json()
}

;(async () => {
  // 18/11/2026: lê também os cartões fechados à mão (o usuário marca "Passou" e fecha): se o teste ainda está
  // no arquivo, entra no resumo, para o /testes apagá-lo (antes ficava no arquivo para sempre).
  const noArquivo = new Set(lerTestes(fs.readFileSync('TESTES-PENDENTES.md', 'utf8')).map(i => i.numero))
  const todos = []
  for (let pagina = 1; ; pagina++) {
    const lote = await obter(`/issues?labels=teste&state=all&per_page=100&page=${pagina}`)
    todos.push(...lote)
    if (lote.length < 100) break
  }
  const cartoes = todos.filter(c => !c.pull_request && (c.state === 'open' || noArquivo.has(numeroDoCartao(c))))
  let semNovidade = 0
  for (const cartao of cartoes.sort((a, b) => a.number - b.number)) {
    const resultado = resultadoDoCartao(cartao.body)
    if (resultado === 'não marcado' && !cartao.comments) { semNovidade++; continue }
    const fechado = cartao.state === 'open' ? '' : ' (cartão fechado à mão; teste ainda no arquivo)'
    console.log(`\n${numeroDoCartao(cartao)} (cartão #${cartao.number}): ${resultado}${fechado}`)
    if (cartao.comments) {
      for (const c of await obter(`/issues/${cartao.number}/comments`)) {
        if (c.body.startsWith('Resolvido:')) continue
        console.log(`  Comentário (${c.created_at.slice(0, 10)}): ${c.body.replace(/\s+/g, ' ').trim()}`)
      }
    }
  }
  console.log(`\nCartões abertos sem marca nem comentário: ${semNovidade}`)
})().catch(erro => { console.error('Não foi possível ler o GitHub: ' + erro.message); process.exit(1) })
