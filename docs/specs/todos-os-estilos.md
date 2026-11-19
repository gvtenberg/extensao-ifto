# All text styles in every document

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** in progress (stage 1 done in v0.29.0)
- **Requested on:** 18/11/2026 (idea), planned 19/11/2026 · **Deadline or priority:** none given
- **Planned version:** 0.29.0 (0.28.0 is taken by `aviso-versao-sei.md`; take the next free middle number when coding)

## 1. Goal (what for)

In the SEI editor, every document type shows only its own styles (Edital 41, Ateste 9). The user wants every style (e.g. "Item_Nivel2", "Texto_Fundo_Cinza_Negrito") in every document, keeping the formatting in the saved document and the PDF. It worked when a Despacho can use an Edital style and the PDF shows it formatted.

## 2. Out of scope

- Header, signature and footer parts of the document (they keep the SEI rules).
- Creating new styles or changing the formatting of existing ones.
- Making the formatting stay for people without the extension (only a note warns them; see rule R7).

## 3. Decisions to confirm

All answered on 19/11/2026 (user, choice window):

- [x] D1 – Where the list of styles comes from. Answer: a fixed list in the extension (the Edital styles, name + CSS) **plus** styles learned from every editor opened on the computer (saved in the browser storage).
- [x] D2 – Which parts. Answer: only the main text (where the type's text styles, e.g. `Texto_Justificado`, are allowed); header, signature and footer keep the SEI rules.
- [x] D3 – Saved document and PDF. Answer: a hidden `<style>` block with the CSS of the extra styles used, like `numeracao-edital` (critical test).
- [x] D4 – Setting. Answer: switch in the SEI settings, **on by default**, for **all SEI units** (user, 19/11/2026).
- [x] D5 – People without the extension. Answer: extra styles marked with "★" in the list and a one-line note at the end of the list.
- [x] D6 – Order. Answer: the type's own styles first (as today), then the extra ones in alphabetical order.
- [x] D8 – No repeated styles in the list (user, 19/11/2026). Answer: an extra style whose **name** the document type already has is not shown (the type's own one stays); styles with different names stay even if they look the same.
- [x] D7 – Switch turned off and a document already uses extra styles. Answer: a small box in the editor warning that they may be lost on save, with a button to turn the switch back on.

## 4. Decided rules

- R1 – Acts only in the SEI editor window (`acao=editor_montar`), every document type and every unit, while the switch "Todos os estilos em todos os documentos" is on (default on).
- R2 – Style list = fixed list (from the Edital 3384558: `nome`, `classeCss`, CSS) + styles learned from each editor opened (name + CSS from `infra.estilo` and the type's CSS list); a learned style with the same name replaces the fixed one.
- R3 – Extra styles are allowed only in the main-text parts (the roots where the type's own text styles are allowed); never in header, signature or footer roots.
- R4 – The type's own styles first, unchanged; then the extra ones, alphabetical, shown as "★ Nome". No name appears twice: an extra style with the same name as one of the type's own is left out (the type's own CSS wins), and the fixed and learned lists are merged by name (R2).
- R5 – At the end of the list one line: "Estilos com ★ vêm da extensão; quem editar sem ela pode perder essa formatação."
- R6 – When an extra style is used, the document gets one hidden `<style>` block (recognized by the comment `extensao-ifto: estilos extras`) with only the CSS of the extra styles in use; updated when styles change, removed when none is used. The SEI's own styles are never copied into it.
- R7 – Switch off + document with extra styles: a box "Este documento usa estilos da extensão; ao salvar com a opção desligada, eles podem ser perdidos." with the button "Ligar de novo". Nothing is changed in the text.
- R8 – Never saves: the person clicks "Salvar" in the SEI as always.

## 5. What changes

- Sites and pages: SEI editor window only.
- Data read or written: reads the editor's style settings and CSS; writes only into the open editor text (the hidden style block), saved by the person. Browser storage: learned styles.
- Extension screens: SEI settings switch (on by default); "★" styles and note in the editor style list; warning box (R7) using the existing editor box (`sites/sei/caixa-editor.js`).
- Likely code files: `comum/todos-os-estilos.js` (pure rules: merge lists, pick extra styles in use, build the style block, with `testes/todos-os-estilos.test.js`), `sites/sei/editor-estilos.js` (MAIN world, like `editor-numeracao.js`: add the styles to the `EstiloEditing` plugin's `estilos` with `permitidoEm` = main-text roots, CSS in the editor page), `sites/sei/todos-os-estilos.js` (content script: setting, box), `comum/configuracoes.js`, settings page, `manifest.json`.
- Technical risk (stage 1 checks it): the editor is already built when the extension runs; the plan is to change `editor.plugins.get('EstiloEditing').estilos` at run time (the style list is read from it with `getEstilosPermitidos`). If the dropdown does not refresh, fallback: rebuild the editor with the same text (`infraEditor.montar`, as in the 3384558 recovery). Also unknown: whether the SEI server removes classes of other types when saving (critical test T-a).

## 6. Stages

- [x] Stage 1 – Pure rules + fixed list (`comum/todos-os-estilos.js`, Node tests) and the MAIN-world part showing the extra styles (★, order, no repeated names, note) in the main text of any document, with their formatting in the editor. Test: open a Despacho, see Edital styles, apply one.
- [ ] Stage 2 – Hidden style block in the document (R6) and learned styles (R2). Test (critical): save a Despacho with "Item_Nivel2", reopen it, see the PDF formatted.
- [ ] Stage 3 – Settings switch (on by default), warning box when off (R7), README and `regras/sei.md`. Test: turn off, open the same Despacho, see the box; "Ligar de novo" works.

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese). Critical: the saved document and PDF keep the extra style (stage 2).
