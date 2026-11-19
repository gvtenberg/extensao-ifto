# Update the document date to today (Ofício, Portaria)

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** stage 1 coded (v0.23.0), waiting for the critical test T114. v0.26.9: the box became the date check of every type (`conferir-documento.md`, stage 8): button "Corrigir para …", switch "Data do documento" (answers D4).
- **Requested on:** 18/11/2026
- **Planned version:** 0.23.0

## 1. Goal (what for)

In some SEI 5 document types (Ofício, Portaria) the date is filled in by the SEI when the document is created and cannot be edited in the editor (SEI 4 allowed editing the HTML). A button in the editor changes that date to today, so a document prepared days ago can be signed with the right date.

## 2. Out of scope

- Other document types (only Ofício and Portaria, by name).
- Saving or signing: the extension never clicks Salvar here.
- Choosing another date: the button only puts today's date.

## 3. Decisions to confirm

- [x] D1 – Where: box in the SEI editor window (like "Remover marca MINUTA").
- [x] D2 – Which documents: only types whose name starts with "Ofício" or "Portaria".
- [x] D3 – Saving: the extension only changes the text; the person checks and clicks Salvar.
- [ ] D4 – On/off setting in the settings page? Suggestion: no setting (the box only appears when the date has passed and can be closed).
  - Answer:

## 4. Decided rules

- The box appears only when the document date is before today (computer date, the day the editor is opened).
- Date looked for: "D de mês de AAAA" (any capitalization) in the locked sections first; if none, in a short section that is only "Cidade, D de mês de AAAA." Body text with cited dates is never changed.
- Only the day, month and year change; city, punctuation and capitalization stay (e.g. "DE 28 DE ABRIL DE 2026" → "DE 18 DE NOVEMBRO DE 2026").
- Code reuse (user request, 18/11/2026): the MINUTA box and the "ask the background" helper move to a shared file used by both features; the background reuses one helper to run functions in the editor.
- Reuses `editorLer` / `editorGravar` (`sites/sei/editor-minuta.js`); can be undone with Ctrl+Z.

## 5. What changes

- Pages: SEI editor window (`editor_montar`).
- Data written: only the editor text, saved by the person. **Unknown:** whether the SEI keeps a change in a locked section when saving (critical test).
- Screens: box "IFTO" in the editor window, same look as the MINUTA box (shared box code).
- Likely files: `comum/data-documento.js` (pure rule + tests), `sites/sei/data-documento.js`, shared box `sites/sei/caixa-editor.js`, `fundo/fundo.js`, `manifest.json`.

## 6. Stages

- [x] Stage 1 – Ofício and Portaria: button, rule, tests (v0.23.0, 18/11/2026). Pages studied: Ofício 3163788 (CKEditor 4, section "Data" readOnly) and Portaria de Pessoal 3390422 (CKEditor 5, date in the locked "Identificador"). Tests T114 to T117.

## 7. Manual tests

In `TESTES-PENDENTES.md` (Portuguese).
