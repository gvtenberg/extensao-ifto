# Compras IFTO pieces into the SEI

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests · 8. Other integration ideas

- **Status:** done (16/11/2026); waiting for the manual tests T87 to T94
- **Requested on:** 16/11/2026 (dcarvalho89, bidding team CCL) · **Priority:** test first in the CCL
- **Planned version:** 0.19.0 to 0.22.0 (done in 0.19.0 to 0.21.0: stage 4 had only docs, so no new version)

## 1. Goal (what for)

The Compras IFTO system (`https://compras-ifto-teste-v1-mbro.onrender.com/`, project `Compras_IFTO_teste_v1_AI_Studio`) writes the pieces of a purchase (DFD, ETP, TR, Edital, declarations…). Today the user clicks "Copiar para o SEI", creates the document in the SEI by hand (type, access level), opens the editor, pastes with Ctrl+V and clicks Salvar. With this improvement the user clicks **"Enviar ao SEI"** in Compras IFTO and, in the SEI process, **one confirmation** creates the document with the right type and text and saves it. **It never signs.** It works when the matching document shows up saved in the process tree with the Compras text.

## 2. Out of scope

- Signing (never automatic: the user signs in the SEI as usual).
- Creating the SEI process from Compras IFTO, sending PDFs as external documents, sending the SEI document number back to Compras: section 8 (ideas).
- The Compras IFTO server talking to the SEI (API `mod-wssei`): not used; everything happens in the user's browser with the user's own SEI login.
- Units other than CCL in "Automática" (other units only with "Sempre ligada").

## 3. Decisions to confirm

Claude does not code while there is a `[ ]` that affects the stage.

- [x] D1 – How automatic? Answer (16/11/2026): **the extension creates the document** and **saves it by itself** after the confirmation, **never signs**. The click on the confirmation is the approval (same exception as "Assinar e próximo" and the payment documents).
- [x] D2 – Permission for the Compras IFTO site: **optional**, with a "Permitir no Compras IFTO" button (like the SICAF); colleagues who do not use Compras IFTO see nothing new.
- [x] D3 – Channel: **small change in Compras IFTO too** (an "Enviar ao SEI" button that only appears when the extension is installed and allowed), instead of reading the Compras screen.
- [x] D4 – SEI document type: the extension reads the SEI's own type list, **suggests the closest to the piece title** (e.g. "Termo de Referência") and the user confirms or changes it in the confirmation window.
- [x] D5 – Process: the **process open in the SEI**. If the NUP sent by Compras IFTO is different, the window warns (in red) before the confirmation.
- [x] D6 – Access level: **Público by default**, changeable to Restrito in the window (with the legal basis, "hipótese legal", from the SEI list).
- [x] D7 – Where it works: unit **`CCL/GAC/DAP/PAL/REI/IFTO`** in "Automática"; setting Automática / Sempre ligada / Desligada like the other features.
- [x] D8 – Pieces waiting: Answer (16/11/2026): **a list**; each piece has its own "Incluir" in the SEI and leaves the list once included.
- [x] D9 – Same piece twice: Answer: **warn and ask again** when the tree already has a document of the same type created today.
- [x] D10 – Compras IFTO addresses: Answer: **only** `https://compras-ifto-teste-v1-mbro.onrender.com/`.

## 4. Decided rules

Moved to `../../regras/compras-ifto.md` at the end (16/11/2026).

- Never signs; never writes to the SEI without the confirmation window (D1).
- The piece text goes into the body of the document only; the header and footer come from the SEI type's own model (same as "Copiar para o SEI" today).
- Compras IFTO data is test data (fictitious); no passwords or personal data travel in the message.
- The extension accepts messages only from the allowed Compras IFTO address, from the page itself (`event.source === window` and `event.origin` checked), with the expected format; anything else is ignored.

## 5. What changes

- Sites and pages: Compras IFTO (optional permission, D2/D10); SEI process page (bar button), SEI document pages (type choice, `documento_gerar`, editor).
- Data written: one internal document in the SEI process open (type, access level, text) and saved. In the browser (`storage.local`): `pecasCompras` (list: title, NUP, phase, HTML, time it arrived; D8).
- Screens: bar button "N peças do Compras IFTO" opening the list, each with "Incluir neste processo" (D8); confirmation window (process, NUP check, type, access level, text preview, "Criar e salvar"); settings card "Licitação (CCL): peças do Compras IFTO" with the "Permitir no Compras IFTO" button (v0.19.0: in the settings, not in the icon window: the icon window cannot know which site is open without one more permission).
- Likely code files: `sites/compras-ifto/ponte.js` (new, on the Compras page: tells the page the extension is there, receives the piece); `comum/compras-ifto.js` (new, pure rules: message check, type suggestion, NUP comparison); `sites/sei/compras-ifto.js` (new, bar button and window); `sites/sei/sei-pedidos.js` (create internal document without screens, fill and save the editor); `fundo/fundo.js` (injects the bridge with `scripting.executeScript` when a Compras IFTO page finishes loading, only with the permission, like the SICAF pages; content scripts in the manifest would be required in Chrome); `manifest.json` (optional host); `configuracoes/`.
- Compras IFTO (other repository): `src/pages/Editor.tsx` (button "Enviar ao SEI" next to "Copiar para o SEI", shown when `<html data-extensao-ifto>` exists) and `src/lib/pecas.ts` (sends `{origem:'compras-ifto', tipo:'enviar-ao-sei', titulo, nup, fase, html}` with `window.postMessage`, the same HTML as `htmlParaSei`/`minutaParaSei`).
- Open technical point (shown in the result window since stage 3, test T91): the Compras docs say the IFTO SEI editor is CKEditor 4.17 (test of 11/11/2026), but `melhorias-futuras.md` says SEI 5.0.4 has a CKEditor 5 multi-root editor at `window.infraEditor.editor` (12/11/2026). How stage 3 fills and saves depends on it.

## 6. Stages

Each stage fits in a short conversation (`/etapa compras-ifto-no-sei <n>`) and ends with tests, version and commit.

- [x] Stage 1 (v0.19.0, 16/11/2026) – **Piece reaches the SEI, nothing written.** Optional permission and bridge on Compras IFTO; "Enviar ao SEI" button in Compras (branch `enviar-ao-sei` of dcarvalho89/compras-ifto-teste-v1); in the SEI (CCL) the bar shows the waiting pieces (list) and the confirmation window with type suggestion, access level, NUP check, same-type warning and preview; the button only said what it would do. The editor survey moved to stage 3: the result window shows which editor and sections the SEI used. Tests T87 to T89.
- [x] Stage 2 (v0.20.0, 16/11/2026) – **Create the document (Crítico).** After the confirmation, creates the internal document without screens (type, "Texto inicial: Nenhum", access level, hipótese legal when Restrito) and refreshes the tree. Text still empty. The editor and text links come from the SEI answer or, if missing, from the new document's page in the tree. Test T90.
- [x] Stage 3 (v0.21.0, 16/11/2026) – **Fill and save (Crítico).** Puts the piece in the body section and saves (no signing); refreshes the tree for checking. On an SEI error, shows the SEI message and keeps the piece waiting. How: popup window with the editor (`windows.create`), function `sites/sei/editor-preencher.js` run inside the page (world MAIN): waits for CKEditor 5 (`window.infraEditor.editor`) or CKEditor 4 (`CKEDITOR.instances`); body = the only editable section, or the one labeled "corpo"; otherwise it stops (never writes in a doubtful place); Salvar = CKEditor 4 `save` command or the toolbar button whose label starts with "Salvar"; SEI `alert`/`confirm` during the save are caught and shown (confirm answered "no"). Saved text checked on `documento_visualizar`. Risk to watch in T91: the editor opened without `window.opener` (the SEI may try to refresh the tree through it). Tests T91, T92.
- [x] Stage 4 (16/11/2026) – **Finish.** Duplicate warning (D9, already in stage 1), README and settings text, rules to `regras/compras-ifto.md`, spec to `feitas/`. Tests T93, T94.

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T87…, in Portuguese).

## 8. Other integration ideas (not planned; for the user to choose later)

1. **SEI number back to Compras IFTO:** after saving, send the new document number ("SEI nº 1234567") to Compras IFTO, so later pieces cite it (e.g. the TR cites the ETP and the DFD).
2. **Create the SEI process** from "Nova contratação" (type, specification, interested party) and send the NUP back to Compras IFTO.
3. **PDFs as external documents:** price research report, certificates, SICAF and similarity PDFs from Compras IFTO go to the process as external documents (the extension already does this for the payment documents, `incluirExternos`).
4. **Checklist SEI × Compras:** compare the process tree with the Compras phases and show which pieces are still missing in the SEI (AGU checklists).
5. **Several pieces at once:** send every finished phase to the SEI in order with one confirmation.
6. **Signature block:** after saving, offer to add the documents to the authority's signature block (the authority signs with the signature list of the Direção-geral).
