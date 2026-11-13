# Architecture: file map

Read only when you need to locate code. When creating an important file, add a row here.

Plain JavaScript, no build step, Manifest V3 (D4 in `specs/base-e-sei.md`). Pure rules live in `comum/` and are tested in Node (`testes/`); code that touches pages lives in `sites/<site>/`. Code identifiers and comments stay in Portuguese (existing convention); docs are in English.

| File or folder | Purpose |
| --- | --- |
| `manifest.json` | Name, version, permissions, sites where the extension acts (`sei.ifto.edu.br/…controlador.php?acao=…` and `…login.php…`) and scripts per page |
| `comum/sei.js` | SEI page-reading rules: version (`versaoDoSei`), password field attributes (`atributosDoCampoDeSenha`) |
| `comum/configuracoes.js` | Settings in the browser: defaults (`PADROES`), `comPadroes`, read and write |
| `comum/lista-assinaturas.js` | Signature list: parse pasted lines (`lerLista`), acknowledgement item, feature on by unit (`funcaoLigada`), counter and next pending |
| `comum/documento-externo.js` | External document: new vs. existing page (`ehDocumentoExternoNovo`), today's date (`dataDeHoje`), what is still empty (`oQuePreencher`) (v0.6.0) |
| `comum/documentos-pagamento.js` | Payment documents (CGOC): unit, types in order (`TIPOS`), feature on by unit (`funcaoLigada`) (v0.7.0); process tree reading (`lerArvore`: done in the SEI, with file), blank documents (`documentosEmBranco`), type option (`acharOpcao`), confirmation text (v0.8.0); short question, form body in ISO-8859-1 (`codificarLatin1`, `montarCorpo`, `trocarCampos`), SEI error text (`mensagemDoSei`) (v0.9.0) |
| `comum/atualizacao.js` | Check for update: latest GitHub Release address, `compararVersoes`, `lerRelease` (version, `.xpi`, Release page) |
| `comum/estilo.css` | Colors and components of the extension's own pages (system pattern) |
| `sites/sei/todas-as-paginas.js` | On every SEI page: saves the SEI version and address (`seiVisto`) |
| `sites/sei/barra-extensao.js` | Extension bar at the top right of full SEI pages; features add buttons (`ExtensaoIFTO.barra.botao/mostrar/fundo`) (v0.7.0) |
| `sites/sei/documentos-pagamento.js` | "Incluir Sicaf, Consulta e Anexo" button in the bar, only with a process open (`#ifrArvore`) (v0.7.0); confirmation (v0.8.0); sends the SEI forms directly (Incluir Documento › Externo › type › Salvar, three times) and reloads the tree (v0.9.0) |
| `sites/sei/lista-assinaturas.js` | Signature list floating panel (SEI main page): paste, navigate, open via quick search, "Assinar e próximo" / "Dar ciência e próximo" (waits for the SEI to reload the tree, then advances) |
| `sites/sei/lista-assinaturas-teclas.js` | Alt+→ and Alt+← shortcuts with focus inside SEI frames (notifies the main page) |
| `sites/sei/assinar-e-proximo.js` | Inside the SEI signing window: clicks "Assinar" if Firefox already filled in the password and marks the pending item as sent (v0.5.0) |
| `sites/sei/documento-externo.js` | New external document (`acao=documento_receber`): today's date, Nato-digital and Público in empty fields, with a note (v0.6.0) |
| `sites/sei/campo-senha.js` | Password field recognized by the browser (`login.php` and `acao=documento_assinar`, also inside the signing window) |
| `janela/` | Icon window: extension version, recognized SEI, Settings and Check for update buttons (the latter hidden in Chrome) |
| `configuracoes/` | Settings page (each choice is saved immediately) |
| `icones/` | `icone.svg` (Firefox) and `icone-16/32/48/128.png` (Chrome) |
| `scripts/empacotar-chrome.js` | `npm run empacotar-chrome`: Chrome/Edge package (folder + `.zip` in `web-ext-artifacts/chrome/`, PNG icons, no Firefox keys) |
| `testes/` | Automated tests (`npm test`) |
| `.github/workflows/testes.yml` and `.github/scripts/` | Test cards on GitHub: one card per new test, closes resolved ones (`testes-para-cartoes.js`); `ler-resultados.js` summarizes what the user marked (for `/testes`); `testes-pendentes.js` reads the file |
| `.claude/` | Commands (`/planejar`, `/etapa`, `/testes`) and Claude Code permissions |
| `.github/workflows/assinar.yml` | GitHub: on every push tests and checks; new version: signs with Mozilla (unlisted) and publishes the `.xpi`, the Chrome `.zip` and `updates.json` in Releases (see `publicacao.md`) |

Browser data (`storage.local`): `configuracoes` (options), `listaAssinaturas` (items, position, done items, panel position, pending sign/acknowledge) `documentosPagamentoTarefa` (creation in progress: process, types, position, step), `documentosPagamentoFeitos` (processes done today) and `seiVisto` (version, address and date of the last SEI opened).
