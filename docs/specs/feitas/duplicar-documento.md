# Duplicate a SEI document

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** done (v0.36.0, 24/11/2026), waiting for tests
- **Requested on:** 24/11/2026 · **Deadline or priority:** the user decides
- **Version:** 0.36.0 (both stages)

## 1. Goal (what for)

Option "Duplicar documento" in the menu of the document icon in the process tree: opens the SEI's new document form, in the same process and with the same type, already with the clicked document as "Documento Modelo". The user only checks and clicks Salvar. It worked if the new document has the same text.

## 2. Out of scope

- External documents, e-mails, SEI forms, cancelled documents, blank ones.
- Duplicating into another process, or several documents at once.
- Clicking Salvar, signing or editing the text for the user.

## 3. Decisions to confirm

All answered by the user on 24/11/2026.

- [x] D1 – After the click: open the SEI form pre-filled (no extension window, nothing created without the user's Salvar).
- [x] D2 – After Salvar: new document selected in the tree and editor open. Expected from the SEI itself (it opens the editor of a new document); the extension adds something only if the test shows it does not.
- [x] D3 – Access level: same as the original (with its Hipótese Legal), changeable on the form.
- [x] D4 – Fields copied: Descrição, Interessados (and Destinatários), Classificação por Assuntos. Not touched: Número and Nome na Árvore.
- [x] D5 – Which documents: all made in the SEI editor, signed or not, from any unit, when the process has "Incluir Documento".
- [x] D6 – Type not in the unit's Incluir Documento list: only warn, open nothing.
- [x] D7 – Interessados and Assuntos: the original's list replaces what the SEI suggested, without duplicates.
- [x] D10 – Original's Interessados or Assuntos empty but the SEI suggests some: leave empty, like the original.
- [x] D8 – Original's registration not readable: open the form anyway with type and model; notice; access level unmarked (the automatic "Público" does not act).
- [x] D9 – Switch in the settings (Documentos do SEI), on by default.

## 4. Decided rules

- The option appears only for documents with the `documento_interno` icon and a process with the "Incluir Documento" link; same style as the director's list options (green "IFTO" tag, above "Fechar"). If both features are on, "Duplicar documento" comes first.
- Nothing is written to the SEI by the extension: the pages it reads are only opened (GET, and the type choice that only returns the form); Salvar is always the user's click.
- If the SEI refuses the model (e.g. draft of another unit), its own message appears on Salvar and the form stays as the SEI leaves it.
- SEI slow, down or session ended: time limit with a plain warning; nothing is left stuck and the document on screen stays.
- The data to fill the form goes straight from the main page to that form (process and type checked) and is never stored.
- The level and the fields are filled only on the form opened by the option; an ordinary Incluir Documento is unchanged.

## 5. What changes

- **Pages:** process tree (`ifrArvore`, menu `#serialtip`); new document form (`acao=documento_gerar`, `frmDocumentoCadastro`); on reading, the original's registration form (`acao=documento_alterar`, link in the document's tree actions).
- **Form fields** (saved page `pagina-sei-adicionar-edital-gabinete.html`): `optProtocoloDocumentoTextoBase` (value D) + `txtProtocoloDocumentoTextoBase` (SEI number, digits only); `txtDescricao`; `selInteressados`/`hdnInteressados`, `selDestinatarios`/`hdnDestinatarios`, `selAssuntos`/`hdnAssuntos` (SEI lists: the hidden field must match the list); `optPublico`/`optRestrito`, `selHipoteseLegal` (loaded by AJAX after Restrito: wait for it). "Sigiloso" is not copied: level left unmarked.
- **Type:** id from the original's registration form (`hdnIdSerie`); if not readable, name at the start of the tree label compared with the Incluir Documento list (longest match; if none matches surely, warn as in D6).
- **Reuse:** `lerArvore` (`comum/sei.js`, add the `documento_alterar` link), `abrirIncluir`/`formularioDoTipo` (`sites/sei/compras-ifto.js`, move to `sei-pedidos.js`), menu option and closed folders (`sites/sei/lista-direcao.js`: `opcaoDoMenu`, `porOpcoes`, moved to a shared file so both use it).
- **Knock-on:** `documento-externo.js` marks Público on a new internal document: it must not act on this form (D3, D8). `menu-copiar.js` keeps working in the same menu.
- **Likely new files:** `comum/duplicar-documento.js` (rules and tests), `sites/sei/duplicar-documento.js`; settings switch `duplicarDocumento`; README.
- **No new permission or site.**
- **Saved page (`formulario-documento.html`, 24/11/2026):** registration form of an existing document (open a Despacho in the SEI, click "Consultar/Alterar Documento", save the page in `ferramentas-de-teste/paginas-sei/`). Ask the user before stage 2.

## 6. Stages

- [x] Stage 1 – Menu option, type found, SEI form opened in the document frame with type and Documento Modelo filled in; warnings (type missing, SEI down); switch. Access level left unmarked for now. Test: duplicate a signed Despacho and an unsigned one.
- [x] Stage 2 – Original's registration read; Descrição, Interessados, Destinatários, Assuntos and access level copied; notice when not readable; README and rules in `regras/sei.md`. Test: public, restricted and another unit's document.

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (in Portuguese). Critical: first duplicate saved in a test process (text equal, number and signature not copied, editor opened).
