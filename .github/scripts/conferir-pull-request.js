// Conferência do pull request (assinar.yml, só em pull_request; 18/11/2026). Recusa, com mensagem clara, o pull request
// que: não tem o master mais novo; altera as regras gerais do dono (docs/claude-regras/); usa versão fora da sequência;
// reaproveita número de teste. Quem fez o pull request (ou o Claude dele) lê as mensagens em "Details" da conferência.
// No GitHub o checkout do pull request é um merge: HEAD^1 = master, HEAD^2 = o branch do colega.
const { execSync } = require('node:child_process')

const REPO = 'https://github.com/gvtenberg/extensao-ifto.git'
const SO_TEXTOS = /(\.md$|^docs\/|^LICENSE$|^\.claude\/|^\.github\/workflows\/testes\.yml$|^\.github\/scripts\/(apagar-testes|ler-resultados|testes-para-cartoes|testes-pendentes)\.js$)/

// Versões aceitas logo depois da do master: último número +1, ou número do meio +1 (melhoria nova).
function versoesAceitas (doMaster) {
  const [a, b, c] = doMaster.split('.').map(Number)
  return [`${a}.${b}.${c + 1}`, `${a}.${b + 1}.0`]
}

// Maior número de T e de P que já existiu (o arquivo atual e tudo o que já passou por ele no git).
function maioresNumeros (texto) {
  const maior = { T: 0, P: 0 }
  for (const m of texto.matchAll(/^[+-]?### ([TP])(\d+)/gm)) maior[m[1]] = Math.max(maior[m[1]], Number(m[2]))
  return maior
}

function numerosNovos (antes, depois) {
  const tinha = new Set([...antes.matchAll(/^### ([TP]\d+)/gm)].map(m => m[1]))
  return [...depois.matchAll(/^### ([TP])(\d+)/gm)].filter(m => !tinha.has(m[1] + m[2])).map(m => ({ letra: m[1], n: Number(m[2]) }))
}

function conferir () {
  const sh = c => execSync(c, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const ler = (rev, arq) => { try { return sh(`git show ${rev}:${arq}`) } catch { return '' } }
  const erros = []
  const atualizar = `git fetch ${REPO} master && git merge FETCH_HEAD (resolva os conflitos, rode npm test, faça o commit e o push no fork)`

  try { sh('git merge-base --is-ancestor HEAD^1 HEAD^2') } catch {
    erros.push(`O fork está desatualizado: falta o master mais novo do gvtenberg/extensao-ifto. Atualize antes de tudo: ${atualizar}. Depois confira de novo a versão e os números dos testes (regras no CLAUDE.md, "Colleague's fork and pull requests").`)
  }

  const mudados = sh('git diff --name-only HEAD^1 HEAD').split('\n').filter(Boolean)
  const regras = mudados.filter(a => a.startsWith('docs/claude-regras/'))
  if (regras.length) {
    erros.push(`O pull request altera as regras gerais do dono (${regras.join(', ')}). Desfaça essa parte: git checkout FETCH_HEAD -- docs/claude-regras (depois de "git fetch ${REPO} master"). Regra útil para todos: escreva como sugestão no texto do pull request.`)
  }

  const versao = v => { try { return JSON.parse(v).version || '?' } catch { return '? (manifest.json com erro: procure linhas <<<<<<<, ======= ou >>>>>>>)' } }
  const doMaster = versao(ler('HEAD^1', 'manifest.json'))
  const doPr = versao(ler('HEAD', 'manifest.json'))
  const aceitas = versoesAceitas(doMaster)
  // Só textos (os mesmos do paths-ignore do assinar.yml): a versão não muda.
  const soTextos = mudados.every(a => SO_TEXTOS.test(a))
  if (soTextos && doPr !== doMaster) {
    erros.push(`Este pull request só muda textos: a versão fica a do master (${doMaster}), não ${doPr}.`)
  } else if (soTextos) {
    // nada a conferir na versão
  } else if (!aceitas.includes(doPr)) {
    erros.push(`Versão ${doPr} fora da sequência: o master está na ${doMaster}. Use ${aceitas[0]} (correções) ou ${aceitas[1]} (melhoria nova), uma só para o pull request inteiro, no manifest.json e no docs/historico.md.`)
  } else if (!ler('HEAD', 'docs/historico.md').includes(`v${doPr} (`)) {
    erros.push(`Falta a linha da versão v${doPr} no docs/historico.md.`)
  }

  const historia = sh('git log -p HEAD^1 -- TESTES-PENDENTES.md') + ler('HEAD^1', 'TESTES-PENDENTES.md')
  const maior = maioresNumeros(historia)
  const repetidos = numerosNovos(ler('HEAD^1', 'TESTES-PENDENTES.md'), ler('HEAD', 'TESTES-PENDENTES.md')).filter(i => i.n <= maior[i.letra])
  if (repetidos.length) {
    erros.push(`Números de teste já usados no master: ${repetidos.map(i => i.letra + i.n).join(', ')}. Renumere os testes novos a partir de T${maior.T + 1} (perguntas: P${maior.P + 1}) e deixe-os no fim do TESTES-PENDENTES.md.`)
  }

  for (const e of erros) console.log(`::error title=Pull request recusado::${e}`)
  if (erros.length) process.exit(1)
  console.log('Pull request conferido: master em dia, versão e números de teste na sequência.')
}

if (require.main === module) conferir()
module.exports = { versoesAceitas, maioresNumeros, numerosNovos, SO_TEXTOS }
