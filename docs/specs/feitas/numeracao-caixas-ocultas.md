# Numbering broken by hidden boxes and typed numbers

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** done (v0.37.0, 26/11/2026; tests T275–T279)
- **Requested on:** 26/11/2026 · **Deadline or priority:** before `remover-formatacao-agu.md` (user, 26/11/2026)
- **Version:** 0.37.0

## 1. Goal (what for)

In Minuta de Ata 3399532 (made from an old SEI model) the item after title 3 shows "3.3" instead of "3.1" (title 4 → "4.3"), with every style. The person needs the automatic numbering to work again, and the numbers typed by hand ("3.1. O órgão…") turned into automatic numbering. It worked when the numbers in the editor and the PDF follow the titles (3.1, 3.2, 4.1…).

## 2. Out of scope

- Changing paragraphs that are already in an Edital-family style (`Item_nivel_*_Edital`) to another family.
- Fixing references inside the text ("conforme item 5.2").
- Saving: the extension never saves; the person checks and clicks Salvar.

## 3. Decisions to confirm

None open (all answered on 26/11/2026, see 4).

## 4. Decided rules

- **Cause found (26/11/2026, saved page `ferramentas-de-teste/paginas-sei/3399532.html`):** part of the text is inside plain `<div>` boxes with no attributes (4 in 3399532: one around item 2.2, one from title 3 on, one at "8.1."…). The CSS counters (`counter-reset` of `item-n2` in the level-1 titles) do not restart across these boxes. Also seen in Minuta de Contrato 3399534 (2) and TR 3399516 (1). Confirmed by the CSS Lists 3 rule (see `regras/sei-editor.md`, "Hidden boxes and typed numbers"); T276 checks it in the editor.
- **D1 – Where:** inside the existing "Corrigir a numeração" section of the single notice window in the editor (`caixa-editor.js`), every unit and document type, same setting as today's numbering fix (user, 26/11/2026).
- **D2 – Hidden boxes:** the section appears when an editable part of the text has paragraphs inside a plain `<div>` (no class, no style). Not touched: the SEI's own `div style="counter-reset…"` (v0.35.3) and the "Processo/Interessado/Assunto" box (has a style/border). One click takes the paragraphs out of the boxes (same order, same styles); one Ctrl+Z undoes it.
- **D3 – Typed numbers (user, 26/11/2026: yes, offer to convert):** a paragraph in a non-numbered style (e.g. `Texto_Justificado`), outside tables, whose text starts with `N.N.` / `N.N.N.` / `N.N.N.N.` (dot at the end optional, then spaces or `&nbsp;`) is offered for conversion: the typed number and the spaces after it are removed and the style becomes **Item_Nivel2 / Item_Nivel3 / Item_Nivel4** (by the number of parts). The user chose the "Item_Nivel" family; paragraphs already in the Edital family stay as they are (both families use the same counters `item-n1…n4`, so they can be mixed).
- **D4 – SEI refuses the style:** in Minuta 3384558 the SEI did not allow `Item_Nivel2` in the main part (`permitidoEm`, `regras/sei-editor.md`). Then that paragraph gets the Edital family (`Item_nivel_2/3/4_Edital`) and the list says so.
- **D5 – Review list (user, 26/11/2026):** an extension window, so it **never opens by itself** (user, 26/11/2026: only a feature that looks like part of the SEI may open automatically, and then with a switch to turn it off); the click on the button in the notice window opens a side panel on the **left** (like "Ver diferenças": no dark background, the page keeps scrolling) listing each paragraph found, all ticked: typed number, the start of the text, the new style and the number it will show ("4.2. → ficará 4.1"; different numbers highlighted, as in 3399532 where 4.1 was deleted). Clicking a line scrolls the editor to it and highlights it; untick to keep. Button "Converter os marcados". This panel is a shared piece, reused by `remover-formatacao-agu.md`.
- Unnumbered subtitles typed as normal paragraphs ("Dos limites para as adesões") stay as they are.
- Never saves; Ctrl+Z undoes; closing without saving undoes.

## 5. What changes

- Sites and pages: SEI editor window (`acao=editor_montar`), any unit and document type.
- Data read or written: only the text in the editor (CKEditor 5 model); nothing saved by the extension.
- Extension screens: new text and button in the "Corrigir a numeração" section; new left side panel (review list).
- Likely code files: `sites/sei/numeracao-edital.js` (or a new `sites/sei/numeracao-caixas.js`), `sites/sei/caixa-editor.js`, new `sites/sei/painel-revisao.js` (shared review list), pure rules in a new `comum/numeracao-digitada.js` (find boxes, read typed numbers, level, expected number) with Node tests; `docs/regras/sei-editor.md`; README.

## 6. Stages

- [x] Stage 1 – Hidden boxes: rule in `comum/` + Node tests (snippets based on 3399532), detection and "Tirar o texto das caixas escondidas" in the "Corrigir a numeração" section, unwrap in the editor model. Test: open 3399532 in the editor, click, change one item to "Item nível 2 Edital" and see "3.1".
- [x] Stage 2 – Typed numbers: rule (number, level, expected number) + tests, shared left review panel (`painel-revisao.js`), conversion with fallback D4. Test: 3399532, convert items 3 to 5, check the numbers in the editor and in the PDF after Salvar.
- [x] Stage 3 – README (Portuguese), rules to `docs/regras/sei-editor.md`, spec to `specs/feitas/`.

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
