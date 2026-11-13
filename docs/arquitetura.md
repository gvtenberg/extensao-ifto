# Architecture: file map

Read only when you need to locate code. When creating an important file, add a row here.

Plain JavaScript, no build step, Manifest V3 (D4 in `specs/base-e-sei.md`). Pure rules live in `comum/` and are tested in Node (`testes/`); code that touches pages lives in `sites/<site>/`. Code identifiers and comments stay in Portuguese (existing convention); docs are in English.

| File or folder | Purpose |
| --- | --- |
| `manifest.json` | Name, version, permissions, sites where the extension acts (`sei.ifto.edu.br/…controlador.php?acao=…` and `…login.php…`) and scripts per page |
| `comum/sei.js` | SEI page-reading rules: tree name up to 50 letters (`nomeNaArvore`, v0.17.0, from sicaf.js); version (`versaoDoSei`), password field attributes (`atributosDoCampoDeSenha`); process tree reading (`lerArvore`: done in the SEI, with file, document link and "Alterar" link (v0.16.0)), shared by payment documents and signature list; feature on by unit (`ligadaNaUnidade`) (v0.9.2) |
| `comum/configuracoes.js` | Settings in the browser: defaults (`PADROES`), `comPadroes`, read and write |
| `comum/lista-assinaturas.js` | Signature list: parse pasted lines (`lerLista`), acknowledgement item, feature on by unit (`funcaoLigada`), counter and next pending; document range (`expandirIntervalo`, v0.9.2) |
| `comum/documento-externo.js` | External document: new vs. existing page (`ehDocumentoExternoNovo`), today's date (`dataDeHoje`), what is still empty (`oQuePreencher`) (v0.6.0) |
| `comum/documentos-pagamento.js` | Payment documents (CGOC): unit, types in order (`TIPOS`), feature on by unit (`funcaoLigada`) (v0.7.0); blank documents (`documentosEmBranco`), type option (`acharOpcao`), confirmation text (v0.8.0); short question, form body in ISO-8859-1 (`codificarLatin1`, `montarCorpo`, `trocarCampos`), SEI error text (`mensagemDoSei`) (v0.9.0) |
| `comum/atualizacao.js` | Check for update: latest GitHub Release address, `compararVersoes`, `lerRelease` (version, `.xpi`, Release page) |
| `comum/estilo.css` | Colors and components of the extension's own pages (system pattern) |
| `sites/sei/todas-as-paginas.js` | On every SEI page: saves the SEI version and address (`seiVisto`) |
| `sites/sei/barra-extensao.js` | Extension bar at the top right of full SEI pages; features add buttons (`ExtensaoIFTO.barra.botao/mostrar/fundo`) (v0.7.0) |
| `sites/sei/documentos-pagamento.js` | "Incluir Sicaf, Consulta e Anexo" button in the bar, only with a process open (`#ifrArvore`) (v0.7.0); confirmation (v0.8.0); sends the SEI forms directly (Incluir Documento › Externo › type › Salvar, three times) and reloads the tree (v0.9.0) |
| `comum/sicaf.js` | Automatic SICAF (v0.10.0): CNPJ check digits and search (`cnpjValido`, `cnpjMatriz` v0.17.0, `acharCnpjs`, `cnpjDaSelecao`), HTML to text, tree names (`tipoNaArvore`, `lerRotuloDaNota`), pending part after the last Folha (`trechoPendente`), ateste reading (`lerAteste`), similar names, invoices without SICAF (`situacaoDoProcesso`); invoice × ateste check (`conferirNota`, v0.12.0) and one set per supplier (`agruparPorFornecedor`); SICAF addresses and pages (`paginaDoCompras`, `ORIGENS_COMPRAS`), PDF file name, result line and SICAF PDF reading, base64 (v0.13.0); tree names (50 letters), documents to create (`documentosParaIncluir`), SEI upload answer and `hdnAnexos` line (v0.14.0); blank documents reused (`aproveitarEmBranco`, v0.16.0) |
| `comum/simples-nacional.js` | Simples Nacional lookup (v0.17.0): form address, result page → lines in page order (`lerLinhas`, `lerResultado`: CNPJ, company name, situations, "Mais informações" loaded), PDF paragraphs with the source line, file name (`ConsultaOptantes_…`) and tree name (`nomeDaConsulta`) |
| `comum/pdf-texto.js` | Small text PDF maker (v0.17.0): A4, Helvetica and Helvetica-Bold with accents (WinAnsi), line wrap by letter width, several pages; text is searchable (`gerarPdf`) |
| `sites/sei/sei-pedidos.js` | Talk to the SEI without screens (v0.10.0, from documentos-pagamento): `pedir` (ISO-8859-1), `baixar` (file), `enviar` (form), `arvoreAberta`, `recarregarArvore`; `incluirExternos` (creates external documents without screens, with tree name and PDF file; v0.14.0, from documentos-pagamento; fills blank ones via "Alterar", v0.16.0) |
| `sites/sei/pdf-texto.js` | PDF text with pdf.js (`bibliotecas/pdfjs/`, Apache-2.0, loaded only when needed, no separate worker) (v0.10.0) |
| `sites/sei/sicaf.js` | Automatic SICAF in the SEI (v0.10.0): CGOC notice "N notas sem SICAF – Buscar" in the bar, re-read when the tree reloads; CNPJ window (v0.11.0); reads the invoices and shows the check window (v0.12.0); asks the background for the SICAF search (v0.13.0); confirmation and inclusion in the SEI (v0.14.0); "Incluir SICAF" button with Sempre ligada (v0.15.0) |
| `sites/sei/sicaf-janela.js` | Extension window in the middle of the SEI page (`ExtensaoIFTO.janela.abrir`, `criar`), used by the SICAF (v0.11.0) |
| `sites/sei/cnpj-selecionado.js` | All SEI frames: "Buscar SICAF" button next to a selected CNPJ (v0.11.0) |
| `fundo/fundo.js` | Background (Firefox page, Chrome service worker): right-click menu "Buscar SICAF deste CNPJ", sends the CNPJ to the SEI main page (v0.11.0); SICAF search (v0.13.0): opens the SICAF tab, follows its pages (login, desktop, SICAF) and injects the scripts below, saves the PDF in Downloads, keeps today's PDFs and returns them to the SEI tab; then (v0.17.2) the Simples Nacional phase in the same tab (`simplesPdfs`, head office when a branch is refused) |
| `sites/simples-nacional/consulta.js` | Simples Nacional "Consulta Optantes" page (injected, v0.17.2): types the CNPJ, Consultar, notice for the site check, "Mais informações", reads the result, makes the text PDF and sends it to the background; back to the form for the next CNPJ |
| `sites/sicaf/consulta.js` | SICAF "Situação do Fornecedor" page (injected): searches the CNPJ and catches the PDF (v0.13.0) |
| `sites/compras/aviso.js` | Notice on Compras pages (injected): login help (Governo card) or "open SICAF from the menu" (v0.13.0) |
| `sites/sei/lista-assinaturas.js` | Signature list floating panel (SEI main page): paste, navigate, open via quick search, "Assinar e próximo" / "Dar ciência e próximo" (waits for the SEI to reload the tree, then advances) |
| `sites/sei/lista-assinaturas-teclas.js` | Alt+→ and Alt+← shortcuts with focus inside SEI frames (notifies the main page) |
| `sites/sei/assinar-e-proximo.js` | Inside the SEI signing window: clicks "Assinar" if Firefox already filled in the password and marks the pending item as sent (v0.5.0) |
| `sites/sei/documento-externo.js` | New external document (`acao=documento_receber`): today's date, Nato-digital and Público in empty fields, with a note (v0.6.0) |
| `sites/sei/campo-senha.js` | Password field recognized by the browser (`login.php` and `acao=documento_assinar`, also inside the signing window) |
| `janela/` | Icon window: extension version, recognized SEI, Settings and Check for update buttons (the latter hidden in Chrome) |
| `configuracoes/` | Settings page (each choice is saved immediately) |
| `bibliotecas/pdfjs/` | pdf.js 6.4.299 legacy build (Mozilla, Apache-2.0, unmodified copy from npm `pdfjs-dist`): reads PDF text |
| `icones/` | Instituto Federal mark (v0.9.5): `icone.svg` (Firefox) and `icone-16/32/48/128.png` (Chrome; drawn pixel-aligned per size, 128 with a 16 px transparent border) |
| `scripts/empacotar-chrome.js` | `npm run empacotar-chrome`: Chrome/Edge package (folder + `.zip` in `web-ext-artifacts/chrome/`, PNG icons, no Firefox keys) |
| `testes/` | Automated tests (`npm test`) |
| `.github/workflows/testes.yml` and `.github/scripts/` | Test cards on GitHub: one card per new test, closes resolved ones (`testes-para-cartoes.js`); `ler-resultados.js` summarizes what the user marked (for `/testes`); `testes-pendentes.js` reads the file |
| `.github/scripts/baixar-assinada.js` | When Mozilla answers "Version X already exists", downloads that version's already-signed `.xpi` (AMO API v5, waits up to 30 min) so `assinar.yml` publishes the Release anyway (12/11/2026) |
| `.claude/` | Commands (`/planejar`, `/etapa`, `/testes`) and Claude Code permissions |
| `.github/workflows/assinar.yml` | GitHub: on every push tests and checks; new version: signs with Mozilla (unlisted) and publishes the `.xpi`, the Chrome `.zip` and `updates.json` in Releases (see `publicacao.md`) |

Browser data (`storage.local`): `configuracoes` (options), `listaAssinaturas` (items, position, done items, panel position, pending sign/acknowledge) `documentosPagamentoTarefa` (creation in progress: process, types, position, step), `documentosPagamentoFeitos` (processes done today), `sicafTarefa` (SICAF search in progress) and `sicafPdfs` (today's SICAF PDFs, one per CNPJ), `simplesPdfs` (today's Simples Nacional PDFs, one per supplier CNPJ, v0.17.2) and `seiVisto` (version, address and date of the last SEI opened).
