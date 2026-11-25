# Remove the MINUTA mark from editais

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** done (waiting for tests)
- **Requested on:** 18/11/2026 · **Deadline or priority:** high (editais being published)
- **Planned version:** 0.22.0

## 1. Goal (what for)

Areas write the "Minuta de Edital" with the SEI Pro MINUTA watermark; the Direção-geral creates the Edital using the minuta as a model, and the mark comes along. In SEI 5, deleting the label no longer removes it, and HTML edits are not saved. The published Edital must not show MINUTA (page or PDF).

## 2. Out of scope

Changing the visible word "minuta" in the text (only a warning). Saving automatically. Other document types.

## 3. Decisions to confirm

All answered by the user on 18/11/2026:

- [x] D1 – Where: box in the SEI editor window (not on the document page).
- [x] D2 – Save: the extension removes; the person checks and clicks Salvar.
- [x] D3 – Who: only in the Direção-geral unit, PAL/REI/IFTO (setting Automática / Sempre ligada / Desligada, like the signature list).
- [x] D4 – Visible "minuta" in the text (title "minuta de EDITAL"): only warn.

## 4. Decided rules

In `regras/sei-editor.md`, section "MINUTA mark in editais (v0.22.0)".

## 5. What changes

- Pages: SEI editor window (`acao=editor_montar`); every SEI page saves unit number → name.
- Data written: only the text inside the open editor; SEI is written only when the person clicks Salvar.
- Screens: box in the editor; settings card "Direção-geral: marca MINUTA nos editais".
- Code: `comum/minuta-edital.js`, `sites/sei/minuta-edital.js`, `sites/sei/editor-minuta.js`, `fundo/fundo.js`, `comum/sei.js`.

## 6. Stages

- [x] Stage 1 – Everything (v0.22.0): rule + tests, editor box, setting, docs.

## 7. Manual tests

T110 (critical) and T111.
