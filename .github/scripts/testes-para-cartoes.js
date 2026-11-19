// GitHub Actions: cria um cartão (issue) para cada teste ou pergunta nova do TESTES-PENDENTES.md
// e fecha os cartões cujo teste saiu do arquivo (resolvido pelo /testes). Usa o GITHUB_TOKEN da Action.
const fs = require('node:fs')
const { lerTestes, corpoDoCartao, planoDosCartoes } = require('./testes-pendentes.js')

const repositorio = process.env.GITHUB_REPOSITORY
const api = `https://api.github.com/repos/${repositorio}`
const cabecalhos = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json'
}

async function chamar (metodo, caminho, dados) {
  const resposta = await fetch(api + caminho, { method: metodo, headers: cabecalhos, body: dados && JSON.stringify(dados) })
  if (!resposta.ok && resposta.status !== 422) throw new Error(`${metodo} ${caminho}: ${resposta.status} ${await resposta.text()}`)
  return resposta.status === 204 ? null : resposta.json()
}

async function todosOsCartoes () {
  const cartoes = []
  for (let pagina = 1; ; pagina++) {
    const lote = await chamar('GET', `/issues?labels=teste&state=all&per_page=100&page=${pagina}`)
    cartoes.push(...lote.filter(c => !c.pull_request))
    // Para só na página vazia: logo depois de apagar cartões, o GitHub devolve páginas incompletas
    // no meio da lista, e parar antes recriava cartões que já existiam.
    if (lote.length === 0) return cartoes
  }
}

;(async () => {
  await chamar('POST', '/labels', { name: 'teste', color: '0e8a16', description: 'Teste manual da extensão' })
  await chamar('POST', '/labels', { name: 'pergunta', color: '1d76db', description: 'Pergunta para o usuário responder' })

  const itens = lerTestes(fs.readFileSync('TESTES-PENDENTES.md', 'utf8'))
  const { criar, fechar } = planoDosCartoes(itens, await todosOsCartoes())
  const repetidos = []

  for (const { item, numeroRepetido } of criar) {
    const labels = item.numero.startsWith('P') ? ['teste', 'pergunta'] : ['teste']
    const aviso = numeroRepetido ? '> ⚠️ Este número já foi usado por outro teste: o Claude vai trocar o número no próximo /testes.\n\n' : ''
    await chamar('POST', '/issues', { title: `${item.numero} – ${item.titulo}`, body: aviso + corpoDoCartao(item), labels })
    console.log(`Cartão criado: ${item.numero} – ${item.titulo}`)
    if (numeroRepetido) repetidos.push(item.numero)
    // O GitHub ordena os cartões pela hora de criação, só até o segundo: cartões do mesmo segundo
    // aparecem fora de ordem. Esperar 1,1 s entre um e outro mantém a ordem dos números.
    await new Promise(pronto => setTimeout(pronto, 1100))
  }

  for (const cartao of fechar) {
    await chamar('POST', `/issues/${cartao.number}/comments`, { body: 'Resolvido: o teste saiu do TESTES-PENDENTES.md.' })
    await chamar('PATCH', `/issues/${cartao.number}`, { state: 'closed', state_reason: 'completed' })
    console.log(`Cartão fechado: ${cartao.title}`)
  }
  // Cartões criados mesmo assim; o aviso vermelho lembra de trocar o número.
  if (repetidos.length) {
    console.log(`::error title=Número de teste repetido::${repetidos.join(', ')}: dois testes diferentes com o mesmo número. Todos ganharam cartão; troque o número do mais novo no TESTES-PENDENTES.md.`)
    process.exit(1)
  }
})().catch(erro => { console.error(erro.message); process.exit(1) })
