// 18/11/2026: conferência do pull request do fork (versão e números de teste na sequência do master).
const test = require('node:test')
const assert = require('node:assert')
const { versoesAceitas, maioresNumeros, numerosNovos } = require('../.github/scripts/conferir-pull-request.js')

test('pull request: versão seguinte ao master (último número +1 ou melhoria nova)', () => {
  assert.deepEqual(versoesAceitas('0.21.1'), ['0.21.2', '0.22.0'])
})

test('pull request: maior número de teste já usado, mesmo os apagados, e testes novos', () => {
  const historia = '-### T95 – apagado\n### T90 – a\n### P4 – b\n+### T12 – c'
  assert.deepEqual(maioresNumeros(historia), { T: 95, P: 4 })
  const novos = numerosNovos('### T90 – a\n', '### T90 – a\n### T96 – novo\n### P5 – nova\n')
  assert.deepEqual(novos, [{ letra: 'T', n: 96 }, { letra: 'P', n: 5 }])
})

test('pull request: só textos não mudam a versão; arquivo da extensão muda', () => {
  const { SO_TEXTOS } = require('../.github/scripts/conferir-pull-request.js')
  assert.deepEqual(['README.md', 'docs/a.md', '.github/scripts/testes-pendentes.js', 'LICENSE', 'fundo/fundo.js', 'manifest.json'].map(a => SO_TEXTOS.test(a)),
    [true, true, true, true, false, false])
})

// 25/11/2026: o dono também trabalha por pull request; Dependabot e workflows não mudam a versão.
test('pull request: só o dono muda as regras gerais; Dependabot e workflows não pedem versão', () => {
  const { regrasProibidas, SO_TEXTOS } = require('../.github/scripts/conferir-pull-request.js')
  const mudados = ['docs/claude-regras/CLAUDE.md', 'README.md']
  assert.deepEqual(regrasProibidas(mudados, false), ['docs/claude-regras/CLAUDE.md'])
  assert.deepEqual(regrasProibidas(mudados, true), [])
  assert.ok(['package.json', 'package-lock.json', '.github/dependabot.yml', '.github/workflows/assinar.yml'].every(a => SO_TEXTOS.test(a)))
  assert.equal(SO_TEXTOS.test('sites/package.json'), false)
})
