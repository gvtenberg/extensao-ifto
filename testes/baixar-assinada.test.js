const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { criarJwt, acharVersao } = require('../.github/scripts/baixar-assinada.js')

// Publicação: versão que a Mozilla já tem (execução cancelada) é baixada já assinada.
test('acha a versão e vê se já está assinada', () => {
  const lista = [
    { version: '0.9.2', file: { status: 'unreviewed', url: null } },
    { version: '0.9.1', file: { status: 'public', url: 'https://addons.mozilla.org/x.xpi' } }
  ]
  assert.deepEqual(acharVersao(lista, '0.9.1'), { assinada: true, status: 'public', link: 'https://addons.mozilla.org/x.xpi' })
  assert.equal(acharVersao(lista, '0.9.2').assinada, false)
  assert.equal(acharVersao(lista, '0.8.0'), null)
})

test('chave de acesso da Mozilla (JWT HS256) válida por 60 s', () => {
  const jwt = criarJwt('user:1', 'segredo', 1000)
  const [cabecalho, corpo, assinatura] = jwt.split('.')
  assert.deepEqual(JSON.parse(Buffer.from(cabecalho, 'base64url')), { alg: 'HS256', typ: 'JWT' })
  const dados = JSON.parse(Buffer.from(corpo, 'base64url'))
  assert.equal(dados.iss, 'user:1')
  assert.equal(dados.exp - dados.iat, 60)
  assert.equal(assinatura, crypto.createHmac('sha256', 'segredo').update(cabecalho + '.' + corpo).digest('base64url'))
})

// v0.9.4: queda de conexão ("fetch failed") ou Mozilla ocupada não derruba a publicação: tenta de novo.
test('tenta de novo quando a conexão cai ou a Mozilla está ocupada', async () => {
  const original = globalThis.fetch
  const respostas = [() => { throw new TypeError('fetch failed') }, () => ({ ok: false, status: 503 }), () => ({ ok: true, status: 200 })]
  globalThis.fetch = async () => respostas.shift()()
  const chaves = { emissor: 'user:1', segredo: 's' }
  try {
    const { pedir } = require('../.github/scripts/baixar-assinada.js')
    assert.equal((await pedir('https://x', chaves, 5, 0)).status, 200)
    globalThis.fetch = async () => ({ ok: false, status: 401 })
    await assert.rejects(pedir('https://x', chaves, 5, 0), /respondeu 401/)
    globalThis.fetch = async () => { throw new TypeError('fetch failed') }
    await assert.rejects(pedir('https://x', chaves, 3, 0), /3 tentativas/)
  } finally {
    globalThis.fetch = original
  }
})
