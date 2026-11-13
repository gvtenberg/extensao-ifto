// Para o GitHub Actions (assinar.yml): quando o web-ext sign falha depois de enviar a versão ("Version X already
// exists", execução cancelada ou, v0.9.4, queda de conexão "fetch failed" enquanto esperava a aprovação), baixa da
// Mozilla o .xpi já assinado dessa versão, em vez de falhar. Se a Mozilla ainda estiver assinando, espera (até 30 min).
// Saída 2: a Mozilla não tem a versão (o envio não chegou lá); o assinar.yml então tenta enviar de novo.
//   node .github/scripts/baixar-assinada.js 0.9.1
// Chaves: WEB_EXT_API_KEY e WEB_EXT_API_SECRET (as mesmas do web-ext sign).
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { setTimeout: esperar } = require('node:timers/promises')

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

// v0.9.4: queda de conexão ou Mozilla ocupada (429, 5xx) é passageira: tenta de novo antes de desistir.
// A leitura do conteúdo (ler) fica dentro da tentativa: a conexão também pode cair no meio do download.
// Se a Mozilla pedir para esperar (Retry-After), espera o que ela pediu (até 5 min).
function valeRepetir (status) {
  return status === 429 || status >= 500
}

function pausaPedida (resposta, pausa) {
  const segundos = Number(resposta.headers?.get?.('retry-after'))
  return segundos > 0 ? Math.min(segundos * 1000, 5 * 60 * 1000) : pausa
}

async function pedir (endereco, chaves, ler = resposta => resposta.json(), tentativas = 5, pausa = 15 * 1000) {
  for (let tentativa = 1; ; tentativa++) {
    let resposta
    let motivo
    let espera = pausa
    try {
      resposta = await fetch(endereco, { headers: { Authorization: 'JWT ' + criarJwt(chaves.emissor, chaves.segredo) } })
      if (resposta.ok) return await ler(resposta)
      motivo = `resposta ${resposta.status}`
      espera = pausaPedida(resposta, pausa)
    } catch (erro) {
      motivo = (erro && erro.message) || String(erro)
    }
    if (resposta && !resposta.ok && !valeRepetir(resposta.status)) throw new Error(`Mozilla respondeu ${resposta.status} em ${endereco}`)
    if (tentativa >= tentativas) throw new Error(`Sem resposta da Mozilla depois de ${tentativas} tentativas (${motivo}).`)
    console.log(`Falha passageira ao falar com a Mozilla (${motivo}); nova tentativa em ${espera / 1000} s.`)
    await esperar(espera)
  }
}

async function procurar (id, versao, chaves) {
  let endereco = `${API}/addons/addon/${encodeURIComponent(id)}/versions/?filter=all_with_unlisted&page_size=50`
  while (endereco) {
    const pagina = await pedir(endereco, chaves)
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
    if (!achada) {
      console.error(`A versão ${versao} não aparece na lista da Mozilla.`)
      process.exit(2)
    }
    if (achada.assinada && achada.link) {
      const destino = path.join('web-ext-artifacts', `extensao-ifto-${versao}.xpi`)
      fs.mkdirSync('web-ext-artifacts', { recursive: true })
      fs.writeFileSync(destino, Buffer.from(await pedir(achada.link, chaves, resposta => resposta.arrayBuffer())))
      console.log(`Versão ${versao} já estava assinada na Mozilla: baixada em ${destino}.`)
      return
    }
    if (achada.status === 'disabled') throw new Error(`A Mozilla recusou a versão ${versao}. Aumente a versão no manifest.json e envie de novo.`)
    if (Date.now() - inicio > ESPERA_MAXIMA) throw new Error(`A Mozilla ainda está assinando a versão ${versao} (situação: ${achada.status}). Rode de novo mais tarde.`)
    console.log(`A Mozilla ainda está assinando a versão ${versao} (situação: ${achada.status}); nova consulta em 30 s.`)
    await esperar(INTERVALO)
  }
}

if (require.main === module) principal().catch(erro => { console.error(erro.message); process.exit(1) })
module.exports = { criarJwt, acharVersao, pedir }
