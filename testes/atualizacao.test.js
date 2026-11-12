const { test } = require('node:test')
const assert = require('node:assert/strict')
const { compararVersoes, lerRelease } = require('../comum/atualizacao.js')

test('compararVersoes compara número a número (0.1.10 é mais nova que 0.1.9)', () => {
  assert.ok(compararVersoes('0.1.10', '0.1.9') > 0)
  assert.ok(compararVersoes('0.1.2', '0.2.0') < 0)
  assert.equal(compararVersoes('0.1.3', '0.1.3'), 0)
  assert.equal(compararVersoes('0.2', '0.2.0'), 0)
})

test('lerRelease tira o "v" da versão e acha o .xpi', () => {
  const release = {
    tag_name: 'v0.1.3',
    assets: [
      { name: 'updates.json', browser_download_url: 'https://x/updates.json' },
      { name: 'extensao-ifto-0.1.3.xpi', browser_download_url: 'https://x/extensao-ifto-0.1.3.xpi' }
    ]
  }
  assert.deepEqual(lerRelease(release), { versao: '0.1.3', link: 'https://x/extensao-ifto-0.1.3.xpi' })
})

test('lerRelease devolve null sem .xpi ou sem Release', () => {
  assert.equal(lerRelease({ tag_name: 'v0.1.3', assets: [] }), null)
  assert.equal(lerRelease(null), null)
})
