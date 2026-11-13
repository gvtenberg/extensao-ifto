// Para o GitHub Actions (assinar.yml): quando a Mozilla responde "Version X already exists" (a versão já foi
// enviada antes, por exemplo numa execução cancelada), baixa da Mozilla o .xpi já assinado dessa versão, em vez
// de falhar. Se a Mozilla ainda estiver assinando, espera (até 30 minutos).
//   node .github/scripts/baixar-assinada.js 0.9.1
// Chaves: WEB_EXT_API_KEY e WEB_EXT_API_SECRET (as mesmas do web-ext sign).
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const API = 'https://addons.mozilla.org/api/v5'
const ESPERA_MAXIMA = 30 * 60 * 1000
const INTERVALO = 30 * 1000

// Chave de acesso de curta duração pedida pela Mozilla (JWT assinado com HS256).
function criarJwt (emissor, segredo, agora = Math.floor(Date.now() / 1000)) {
  const base64 = objeto => Buffer.from(JSON.stringify(objeto)).toString('base64url')
  const corpo = base64({ alg: 'HS256', typ: 'JWT' }) + '.' + base64({ iss: emissor, jti: crypto.randomUUID(), iat: agora, exp: agora + 60 })
  return corpo + '.' + crypto.createHmac('sha256', segredo).update(corpo).digest('base64url')
}

// Na lista de versões da Mozilla, a versão pedida; "assinada" quando o arquivo está aprovado (status "public").
function acharVersao (lista, versao) {
  const achada = (lista || []).find(item => item.version === versao)
  if (!achada) return null
  const arquivo = achada.file || {}
  return { assinada: arquivo.status === 'public', status: arquivo.status || 'desconhecido', link: arquivo.url || null }
}

async function pedir (endereco, chaves) {
  const resposta = await fetch(endereco, { headers: { Authorization: 'JWT ' + criarJwt(chaves.emissor, chaves.segredo) } })
  if (!resposta.ok) throw new Error(`Mozilla respondeu ${resposta.status} em ${endereco}`)
  return resposta
}

async function procurar (id, versao, chaves) {
  let endereco = `${API}/addons/addon/${encodeURIComponent(id)}/versions/?filter=all_with_unlisted&page_size=50`
  while (endereco) {
    const pagina = await (await pedir(endereco, chaves)).json()
    const achada = acharVersao(pagina.results, versao)
    if (achada) return achada
    endereco = pagina.next
  }
  return null
}

async function principal () {
  const versao = process.argv[2]
  const chaves = { emissor: process.env.WEB_EXT_API_KEY, segredo: process.env.WEB_EXT_API_SECRET }
  if (!versao || !chaves.emissor || !chaves.segredo) throw new Error('Uso: node baixar-assinada.js <versão> (com WEB_EXT_API_KEY e WEB_EXT_API_SECRET)')
  const id = JSON.parse(fs.readFileSync('manifest.json', 'utf8')).browser_specific_settings.gecko.id
  const inicio = Date.now()
  for (;;) {
    const achada = await procurar(id, versao, chaves)
    if (!achada) throw new Error(`A Mozilla diz que a versão ${versao} existe, mas ela não aparece na lista.`)
    if (achada.assinada && achada.link) {
      const destino = path.join('web-ext-artifacts', `extensao-ifto-${versao}.xpi`)
      fs.mkdirSync('web-ext-artifacts', { recursive: true })
      fs.writeFileSync(destino, Buffer.from(await (await pedir(achada.link, chaves)).arrayBuffer()))
      console.log(`Versão ${versao} já estava assinada na Mozilla: baixada em ${destino}.`)
      return
    }
    if (achada.status === 'disabled') throw new Error(`A Mozilla recusou a versão ${versao}. Aumente a versão no manifest.json e envie de novo.`)
    if (Date.now() - inicio > ESPERA_MAXIMA) throw new Error(`A Mozilla ainda está assinando a versão ${versao} (situação: ${achada.status}). Rode de novo mais tarde.`)
    console.log(`A Mozilla ainda está assinando a versão ${versao} (situação: ${achada.status}); nova consulta em 30 s.`)
    await new Promise(resolve => setTimeout(resolve, INTERVALO))
  }
}

if (require.main === module) principal().catch(erro => { console.error(erro.message); process.exit(1) })
module.exports = { criarJwt, acharVersao }
