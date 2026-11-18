# Tables in the SEI editor

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** done (waiting for tests)
- **Requested on:** 18/11/2026 · **Priority:** urgent (document open waiting for it)
- **Version:** 0.24.0

## 1. Goal

Moving text with tables inside a document loses the table and column widths; SEI 5 has no field for table margins (the old SEI accepted `margin:10px auto 10px 28px`). Fix both for every document type.

## 2. Out of scope

Pasting into another document or window (works as before); "10.10." in Item nível 2 Edital (next improvement).

## 3. Decisions (confirmed by the user on 18/11/2026)

- [x] D1 – How to move: (a) normal Ctrl+X/C/V, nothing new on screen. Answer: (a).
- [x] D2 – Margins: "Alinhar com o texto" button + a box that accepts the old format, **margins only** (width already has its SEI field). Answer: so.
- [x] D3 – Who: every unit, on by default, one switch for each in the settings. Answer: so.

## 4. Decided rules

Moved to `docs/regras/sei.md` ("Tables in the editor").

## 5. What changes

- Editor window (`acao=editor_montar`): `sites/sei/tabelas.js` asks the background, which puts `comum/tabelas-editor.js` and `sites/sei/editor-tabelas.js` inside the page (world MAIN). Nothing is saved: the person clicks Salvar.
- Settings: two checkboxes in "Geral".
- Checked in a headless copy of the SEI 5 editor (scripts saved from Minuta 3384558): the paste keeps the table HTML identical; Ctrl+Z undoes; the margins come out as `margin-…` in the saved HTML and are read back after reopening.

## 6. Stages

- [x] Stage 1 – everything above (v0.24.0).

## 7. Manual tests

T118 to T121 in `TESTES-PENDENTES.md`.
