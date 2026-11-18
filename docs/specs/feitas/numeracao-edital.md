# Long numbers in edital items ("10.10.")

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** done (waiting for tests)
- **Requested on:** 18/11/2026
- **Version:** 0.25.0

## 1. Goal

In "Item nível 2 Edital" the number box fits 5 characters; "10.10." pushes the text to the next line (editor, HTML and PDF). Today people switch the paragraph to another style, which changes the gap suddenly.

## 2. Out of scope

Changing the SEI's own styles (server side). Showing every style in every document type (idea in `melhorias-futuras.md`).

## 3. Decisions (confirmed by the user on 18/11/2026)

- [x] D1 – First chosen: swap only the broken paragraphs to Item_Nivel2. Replaced after the check that Minuta 3384558 does not allow Item_Nivel2 in its main section: **hidden style block in the document** (like SEI Pro's MINUTA).
- [x] D2 – Levels 2, 3 and 4 of the edital.
- [x] D3 – Every unit; the button appears only when the problem is detected; never fixes on its own.

## 4. Decided rules

Moved to `docs/regras/sei.md` ("Long numbers in edital items").

## 5. What changes

- Editor window: `sites/sei/numeracao-edital.js` (box), `sites/sei/editor-numeracao.js` + `comum/numeracao-edital.js` (inside the page). Setting `numeracaoEdital` (on).
- Checked in a headless copy of the SEI 5 editor: 3 broken items found; after the click 0; short numbers stay at the same place; Ctrl+Z undoes; the block is kept in the saved HTML.

## 6. Stages

- [x] Stage 1 – everything above (v0.25.0).

## 7. Manual tests

T122 to T124 in `TESTES-PENDENTES.md`.
