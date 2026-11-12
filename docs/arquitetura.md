# Architecture: file map

Read only when you need to locate code. When creating an important file, add a row here.

Plain JavaScript, no build step, Manifest V3 (D4 in `specs/base-e-sei.md`). Pure rules live in `comum/` and are tested in Node (`testes/`); code that touches pages lives in `sites/<site>/`. Code identifiers and comments stay in Portuguese (existing convention); docs are in English.

| File or folder | Purpose |
| --- | --- |
| `manifest.json` | Name, version, permissions, sites where the extension acts (`sei.ifto.edu.br/…controlador.php?acao=…` and `…login.php…`) and scripts per page |
| `comum/sei.js` | SEI page-reading rules: version (`versaoDoSei`), New document link (`extrairLinkNovoDocumento`), password field attributes (`atributosDoCampoDeSenha`) |
| `comum/configuracoes.js` | Settings in the browser: defaults (`PADROES`), `comPadroes`, read and write |
| `comum/lista-assinaturas.js` | Signature list: parse pasted lines (`lerLista`), acknowledgement item, feature on by unit (`funcaoLigada`), counter and next pending |
| `comum/atualizacao.js` | Check for update: latest GitHub Release address, `compararVersoes`, `lerRelease` (version, `.xpi`, Release page) |
| `comum/estilo.css` | Colors and components of the extension's own pages (system pattern) |
| `sites/sei/todas-as-paginas.js` | On every SEI page: saves the SEI version and address (`seiVisto`) |
| `sites/sei/lista-assinaturas.js` | Signature list floating panel (SEI main page): paste, navigate, open via quick search, "Assinar e próximo" / "Dar ciência e próximo" (waits for the SEI to reload the tree, then advances) |
| `sites/sei/lista-assinaturas-teclas.js` | Alt+→ and Alt+← shortcuts with focus inside SEI frames (notifies the main page) |
| `sites/sei/assinar-e-proximo.js` | Inside the SEI signing window: clicks "Assinar" if Firefox already filled in the password and marks the pending item as sent (v0.5.0) |
| `sites/sei/botao-novo-documento.js` | "Novo documento" button always visible (`acao=arvore_visualizar`) |
| `sites/sei/campo-senha.js` | Password field recognized by the browser (`login.php` and `acao=documento_assinar`, also inside the signing window) |
| `janela/` | Icon window: extension version, recognized SEI, Settings and Check for update buttons (the latter hidden in Chrome) |
| `configuracoes/` | Settings page (each choice is saved immediately) |
| `icones/` | `icone.svg` (Firefox) and `icone-16/32/48/128.png` (Chrome) |
| `scripts/empacotar-chrome.js` | `npm run empacotar-chrome`: Chrome/Edge package (folder + `.zip` in `web-ext-artifacts/chrome/`, PNG icons, no Firefox keys) |
| `testes/` | Automated tests (`npm test`) |
| `.github/workflows/testes.yml` and `.github/scripts/` | Test cards on GitHub: one card per new test, closes resolved ones (`testes-para-cartoes.js`); `ler-resultados.js` summarizes what the user marked (for `/testes`); `testes-pendentes.js` reads the file |
| `.claude/` | Commands (`/planejar`, `/etapa`, `/testes`) and Claude Code permissions |
| `.github/workflows/assinar.yml` | GitHub: on every push tests and checks; new version: signs with Mozilla (unlisted) and publishes the `.xpi`, the Chrome `.zip` and `updates.json` in Releases (see `publicacao.md`) |

Browser data (`storage.local`): `configuracoes` (options), `listaAssinaturas` (items, position, done items, panel position, pending sign/acknowledge) and `seiVisto` (version, address and date of the last SEI opened).
