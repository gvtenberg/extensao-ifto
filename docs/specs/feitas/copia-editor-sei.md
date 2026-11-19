# Automatic copy in the SEI editor

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** done (v0.31.0, 19/11/2026)
- **Requested on:** 12/11/2026 (planned 19/11/2026) · **Deadline or priority:** after a connection drop nearly lost hours of work
- **Planned version:** 0.31.0

## 1. Goal (what for)

When the SEI fails to save ("Ocorreu um erro ao tentar salvar o documento"), the window closes or the connection drops, the text being written is not lost: the extension keeps a copy on the computer and offers it when the document is opened again. Success: after a failed save, reopening the document brings back the text, without risk of erasing newer work.

## 2. Out of scope

- Clicking the SEI "Salvar" by itself (D3: never writes to the SEI without the user's click).
- Keeping several versions (history) of a document: only the latest copy.
- Copies of other SEI fields (e.g. "Especificação", process data): only the editor text and comments.
- Sending copies anywhere outside the computer (no Google, no server).
- New permission "unlimitedStorage" (D10).

## 3. Decisions to confirm

All answered on 19/11/2026 (user, in the chat):

- [x] D1 – Where the copy is kept: extension storage (`storage.local`), not the SEI page `localStorage` (5 MB, readable and erasable by SEI scripts, cleared with site data).
- [x] D2 – Copy deleted as soon as the SEI confirms the save.
- [x] D3 – No automatic click on Salvar.
- [x] D4 – "Copiar conteúdo / Colar conteúdo" buttons go in this spec as the last stage.
- [x] D5 – Switch in the settings, **off** by default.
- [x] D6 – Copy never confirmed by the SEI: deleted 7 days after its last change.
- [x] D7 – Reopening: warning with Restaurar / Ver diferenças / Descartar.
- [x] D8 – Every 30 s, **one copy per document, overwritten** (no file per copy: documents with images are large).
- [x] D9 – Show differences only (changed paragraphs: added green, removed red), not side by side nor the copy alone.
- [x] D10 – No "unlimitedStorage" permission; if space runs out (Chrome, 10 MB), plain warning and the oldest copies are deleted first.
- [x] D11 – All safety rules (section 4: starting point, Desfazer, confirm Descartar, one window per document).
- [x] D12 – Small indicator "Cópia guardada às 10:42" near the SEI buttons, red when the copy fails.

## 4. Decided rules

- Acts only in the SEI document editing window (`sei.ifto.edu.br`), only with the switch on.
- Copy = editor text (`infraEditor.editor.getFullData()`) + comments (`plugins.get('Comentario').getData()`), plus: document id, process and document number, date and time, and the **starting point** (fingerprint of the SEI text when editing began).
- Key = document id: one copy per document, overwritten every 30 s, only when something changed since the last copy.
- Copy deleted when the SEI confirms the save; also 7 days after its last change; the oldest first when space runs out.
- Reopening with a copy different from the SEI text: box "Há uma cópia não salva deste documento (dia, hora)" with **Restaurar**, **Ver diferenças**, **Descartar**.
- SEI text different from the copy's starting point (saved after the copy, by someone else or another window): red warning "O documento foi salvo depois desta cópia. Restaurar apagará essas alterações"; Restaurar asks for confirmation.
- Before restoring, the SEI version is kept; **Desfazer** puts it back (Ctrl+Z does not work after the editor is rebuilt).
- Restaurar never saves: the user checks and clicks Salvar. The copy stays until the SEI confirms the save.
- Descartar asks "A cópia será apagada e não poderá ser recuperada."
- Same document open in two windows: only the first keeps copying; the second shows a warning.
- Differences: changed paragraphs only, numbered; formatting or image only changes appear as "parágrafo com formatação ou imagem diferente".
- Indicator near the SEI buttons, not part of the document (not printed or saved).
- The copy never leaves the computer.
- (coding, 19/11/2026, user asked for full fidelity) The copy is what the SEI sends on Salvar, so bold, italic, colors, backgrounds, links, images and tables (margins and alignment live in the table attributes) come back as saved. After a restore the extension's table and ★ style helpers start again on the new editor, and the result is compared with the copy: if anything differs, the stored copy is kept ("protegida") until the SEI saves, and the box says how many paragraphs differ.
- While an earlier copy waits for the choice, the automatic copy is paused (it would overwrite it); clicking the indicator reopens the box.
- A copy is also taken at the moment Salvar is clicked (if the SEI then fails, nothing typed is lost).
- If the editor refuses the copy, it is reloaded with the text that was there just before.

## 5. What changes

- Sites and pages: SEI document editor (`acao=editor_montar` window), SEI 5.0.4 (CKEditor 5 multi-root, `window.infraEditor`).
- Data read or written: reads the editor; writes only in the extension storage. Writes nothing to the SEI (Restaurar fills the editor; the user saves).
- Extension screens: settings switch (off); indicator in the editor; reopening box; differences window; Copiar/Colar buttons (stage 4).
- Likely code files: `sites/sei/copia-editor.js` (content script) + a MAIN world part (pattern of `sites/sei/editor-minuta.js`); pure rules (fingerprint, cleanup, paragraph differences) in `comum/copia-editor.js` with tests in `testes/`; settings page.
- Reference: saved pages and editor JS in `ferramentas-de-teste/paginas-sei/` (`SEI_IFTO - 3384558 - Minuta de Edital*`, `recuperacao-3384558/`); reload with `infraEditor.montar({initialData, infra:{comentario:{itens}}})` after destroying the editors (line in `melhorias-futuras.md`).

## 6. Stages

- [x] Stage 1 – Copy while editing: switch (off), copy every 30 s overwritten per document, starting point, indicator, delete on SEI save confirmed (find how the SEI shows success and the failure message in the saved pages), 7-day cleanup, space warning. Test: edit, see "Cópia guardada às…"; save, copy gone.
- [x] Stage 2 – Reopening: box with Restaurar / Descartar, starting point check (red warning), Desfazer, confirmation, two-window warning. Test: edit, close without saving, reopen, restore, Desfazer.
- [x] Stage 3 – "Ver diferenças" window (paragraph differences, pure rule with automated tests). Test: change, add and delete paragraphs, compare.
- [x] Stage 4 – "Copiar conteúdo / Colar conteúdo" buttons (off by default, own setting, editing window only), reusing stages 1–2 code. Test: copy from one window, paste in another of the same document.

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese). Stage 2 restore test is critical (decides whether no work is lost).
