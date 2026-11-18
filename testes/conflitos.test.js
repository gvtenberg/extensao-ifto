// v0.21.1: linha de conflito do git esquecida depois de juntar um pull request quebra a extensão ou a lista de testes.
const test = require('node:test')
const assert = require('node:assert')
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

test('nenhum arquivo do git tem linha de conflito (<<<<<<<, =======, >>>>>>>)', () => {
  const raiz = path.join(__dirname, '..')
  let arquivos
  try {
    arquivos = execSync('git ls-files', { cwd: raiz, encoding: 'utf8' }).split('\n').filter(Boolean)
  } catch { return } // sem git (pacote baixado): nada a conferir
  const texto = /\.(js|mjs|json|md|html|css|yml|txt)$/
  const ruins = arquivos.filter(a => texto.test(a) && !a.startsWith('bibliotecas/') && fs.existsSync(path.join(raiz, a)))
    .filter(a => /^(<{7}|={7}|>{7})( |$)/m.test(fs.readFileSync(path.join(raiz, a), 'utf8')))
  assert.deepEqual(ruins, [])
})
