# Architecture: Background, other sites, screens, scripts and GitHub

Search by file name (`grep`). Index: `../arquitetura.md`.

| File or folder | Purpose |
| --- | --- |
| `manifest.json` | Name, version, permissions, sites where the extension acts (`sei.ifto.edu.br/…controlador.php?acao=…` and `…login.php…`) and scripts per page |
| `fundo/fundo.js` | (v0.19.0 to v0.21.0) Compras IFTO: injects the bridge on Compras IFTO pages (only with the permission), keeps the list of pieces (`comprasPeca`), opens the editor window and runs `editor-preencher.js` (`comprasPreencher`, task `comprasTarefa`), answers the SEI tab (`comprasResultado`). Background (Firefox page, Chrome service worker): right-click menu "Buscar SICAF deste CNPJ", sends the CNPJ to the SEI main page (v0.11.0); SICAF search (v0.13.0): opens the SICAF tab, follows its pages (login, desktop, SICAF) and injects the scripts below, saves the PDF in Downloads, keeps today's PDFs and returns them to the SEI tab; then (v0.17.2) the Simples Nacional phase in the same tab (`simplesPdfs`, head office when a branch is refused) |
| `sites/simples-nacional/consulta.js` | Simples Nacional "Consulta Optantes" page (injected, v0.17.2): types the CNPJ, Consultar, notice for the site check, "Mais informações", reads the result, makes the text PDF and sends it to the background; back to the form for the next CNPJ |
| `sites/sicaf/consulta.js` | SICAF "Situação do Fornecedor" page (injected): searches the CNPJ and catches the PDF (v0.13.0) |
| `sites/compras/aviso.js` | Notice on Compras pages (injected): clicks "Entrar com Gov.br" (Governo card), then "SerproID" on the Gov.br login (v0.21.2; only with the `entrarComSerproId` option, v0.21.3) and, on the Área de Trabalho, opens SICAF from the user menu; says where to click when a step fails (v0.13.0; v0.17.3) |
| `sites/compras-ifto/ponte.js` | Compras IFTO page (injected by the background only with the optional permission, v0.19.0): marks `<html data-extensao-ifto>`, receives `window.postMessage` pieces from the page itself and sends them to the background; answers `peca-recebida` |
| `janela/` | Icon window: extension version, recognized SEI, Settings and Check for update buttons (the latter hidden in Chrome) |
| `configuracoes/` | Settings page (each choice is saved immediately); v0.26.0: side menu, one group at a time (address `#sicaf`, `#compras`…), "Minhas unidades" list; base-e-sei: text fields `data-config` (stage 2), "Cópia das configurações" group to download and load the settings file (stage 5; browser permissions are not copied, SerproID stays off without the Gov.br permission) |
| `bibliotecas/pdfjs/` | pdf.js 6.4.299 legacy build (Mozilla, Apache-2.0, unmodified copy from npm `pdfjs-dist`): reads PDF text |
| `icones/` | Instituto Federal mark (v0.9.5): `icone.svg` (Firefox) and `icone-16/32/48/128.png` (Chrome; drawn pixel-aligned per size, 128 with a 16 px transparent border) |
| `scripts/empacotar-chrome.js` | `npm run empacotar-chrome`: Chrome/Edge package (folder + `.zip` in `web-ext-artifacts/chrome/`, PNG icons, no Firefox keys) |
| `testes/` | Automated tests (`npm test`) |
| `.github/workflows/testes.yml` and `.github/scripts/` | Test cards on GitHub: one card per new test, closes resolved ones (`testes-para-cartoes.js`); `ler-resultados.js` summarizes what the user marked (for `/testes`); `testes-pendentes.js` reads the file |
| `.github/scripts/baixar-assinada.js` | When Mozilla answers "Version X already exists", downloads that version's already-signed `.xpi` (AMO API v5, waits up to 30 min) so `assinar.yml` publishes the Release anyway (12/11/2026) |
| `.github/scripts/conferir-pull-request.js` | Pull request check (in `assinar.yml`, runs on every pull request, never signs): refuses an outdated fork, a version out of sequence, a reused test number or a change to `docs/claude-regras/` by anyone but the owner, with the reason in Portuguese (18/11/2026; rules in `CONTRIBUTING.md`) |
| `.claude/` | Commands (`/planejar`, `/etapa`, `/testes`) and Claude Code permissions |
| `.github/workflows/assinar.yml` | GitHub: on every pull request and merge tests and checks; new version: signs with Mozilla (unlisted) and publishes the `.xpi`, the Chrome `.zip` and `updates.json` in Releases (see `publicacao.md`) |
