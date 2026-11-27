// v0.38.0: fundo.js foi dividido em partes. Este teste carrega todas as partes de fundo, na ordem do
// manifest.json, num navegador de mentira, e confere que nada falta (cada recado chega a uma função que existe).
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const raiz = path.join(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(raiz, 'manifest.json'), 'utf8'))

function navegadorDeMentira () {
  const ouvinte = () => ({ addListener () {} })
  const qualquer = new Proxy(function () {}, {
    get: (alvo, nome) => nome === 'then' ? undefined : (['onMessage', 'onInstalled', 'onStartup', 'onClicked', 'onRemoved', 'onUpdated', 'onChanged', 'onAdded'].includes(nome) ? ouvinte() : qualquer),
    apply: () => Promise.resolve({})
  })
  return qualquer
}

test('fundo: todas as partes carregam juntas e cada recado tem a sua função', () => {
  const contexto = { console, URL, Blob: globalThis.Blob, TextDecoder, TextEncoder, setTimeout, clearTimeout, setInterval, clearInterval, atob, btoa, fetch: () => Promise.reject(new Error('sem rede')) }
  contexto.globalThis = contexto
  contexto.browser = navegadorDeMentira()
  vm.createContext(contexto)
  // pdf-texto.js precisa do pdf.js, que não roda no Node: fica de fora.
  for (const arquivo of manifest.background.scripts.filter(nome => !nome.includes('pdf-texto'))) {
    vm.runInContext(fs.readFileSync(path.join(raiz, arquivo), 'utf8'), contexto, { filename: arquivo })
  }
  const fundo = fs.readFileSync(path.join(raiz, 'fundo/fundo.js'), 'utf8')
  const chamadas = [...fundo.matchAll(/case '[^']+': return ([a-zA-Z]+)\(/g)].map(achado => achado[1])
  assert.ok(chamadas.length > 20)
  for (const nome of new Set(chamadas)) assert.equal(vm.runInContext(`typeof ${nome}`, contexto), 'function', nome)
  // Chrome: fundo.js carrega as mesmas partes com importScripts.
  for (const arquivo of manifest.background.scripts.filter(nome => nome.startsWith('fundo/') && nome !== 'fundo/fundo.js')) {
    assert.ok(fundo.includes(`'/${arquivo}'`), arquivo)
  }
})
