// v0.5.0: pacote para o Chrome (e Edge), grátis e sem a loja: pasta + .zip em web-ext-artifacts/chrome/.
// O Chrome não aceita ícone SVG nem as chaves do Firefox; o resto do código é o mesmo.
// Uso: npm run empacotar-chrome
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const raiz = path.join(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(raiz, 'manifest.json'), 'utf8'))
const nome = `extensao-ifto-chrome-${manifest.version}`
const saida = path.join(raiz, 'web-ext-artifacts', 'chrome')
const pasta = path.join(saida, nome)

const PNG = { 16: 'icones/icone-16.png', 32: 'icones/icone-32.png', 48: 'icones/icone-48.png', 128: 'icones/icone-128.png' }
delete manifest.browser_specific_settings
manifest.icons = PNG
manifest.action.default_icon = PNG

fs.rmSync(pasta, { recursive: true, force: true })
fs.mkdirSync(pasta, { recursive: true })
for (const item of ['comum', 'configuracoes', 'janela', 'sites', 'icones', 'LICENSE']) {
  fs.cpSync(path.join(raiz, item), path.join(pasta, item), { recursive: true })
}
fs.writeFileSync(path.join(pasta, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

const zip = path.join(saida, nome + '.zip')
fs.rmSync(zip, { force: true })
execFileSync('zip', ['-r', '-q', zip, '.'], { cwd: pasta })
console.log('Pasta: ' + path.relative(raiz, pasta))
console.log('Arquivo: ' + path.relative(raiz, zip))
