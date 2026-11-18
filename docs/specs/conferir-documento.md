# Check SEI documents: process number, timbre, footer and spacing

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** ready to code (stage 1)
- **Requested on:** 18/11/2026 · **Deadline or priority:** after the open tests of v0.25.x
- **Planned version:** 0.26.0

## 1. Goal (what for)

People copy an old document and forget to fix the "Processo nº:" line, the sector lines below the timbre and the footer (sample 3390347 has the Reitoria footer). In SEI 5 the parts of a Despacho are also too close together. The extension warns about these errors (never fixes without a click), offers a fix button, stops before signing a document with the wrong process number, and adds spacing to the Despacho. The settings page is reorganized first, since it gets a list of units.

## 2. Out of scope

- Checking "Interessado" and "Assunto" (future idea in `melhorias-futuras.md`).
- Process numbers in the body text (they may cite other processes on purpose).
- Timbre and footer of units outside Campus Palmas (Reitoria, other campuses).
- Already signed documents: never touched (only warned before signing).

## 3. Decisions to confirm

- [x] D1 – Spacing: how and when? Answer (18/11/2026): like v0.25.0 (hidden `<style>` block in the text), **added automatically** when the editor opens an unsigned document without it; a box says so and offers "Desfazer"; saved only when the person clicks Salvar. Depends on T123 (does the style block reach the PDF?); if not, fall back to blank lines.
- [x] D2 – Where to stop before signing: all four: "Assinar Documento" in the tree/document page, "Assinar" in the editor, the extension's signature list ("Assinar e próximo" and ranges) and SEI's **Bloco de assinatura**.
- [x] D3 – Sector lines below the timbre: typed per unit in the settings, plus a button in the editor "Usar este timbre como padrão da unidade" (copies the lines of the open document, with confirmation).
- [x] D4 – Footer text: "Quadra 310 Sul, Lo 5, s/n, esquina com a Avenida NS 10 - Plano Diretor Sul — CEP 77021-090" / "Palmas/TO — <telefone>" / "palmas.ifto.edu.br — <e-mail>"; e-mail, site and phone as links.
- [x] D5 – Units for timbre/footer: only Campus Palmas units (SEI sigla with `/PAL/`). The process number check works in any unit.
- [x] D6 – Which number: only the "Processo nº:" identification line at the top.
- [x] D7 – Pre-sign window: only the process number (timbre and footer warned on the document page and in the editor).
- [x] D8 – Settings page: reorganized as stage 1 (side menu, smaller cards, one line per option with a short hint).
- [x] D9 – Spacing size: one blank line in each gap. Types (changed 18/11/2026): **every type**, because the extension detects the tight gaps itself (see rules); if detection proves unreliable in the tests, fall back to Despacho only.
- [x] D11 – Footer formatting (18/11/2026): warn **only about wrong data** (phone, e-mail, CEP digits, address); ignore dots, parentheses, "esquina com a" and the old site address (`portal.ifto.edu.br`, `portal.ifto.edu.br/palmas`).
- [x] D12 – "Reitoria" timbre/footer in a Palmas unit: **always warn**, every type (also Portaria de Pessoal signed by the Reitora).
- [x] D13 – Edital/Minuta title line "(Processo Administrativo n° …)" (an SEI link) is **also checked**, same warning and fix.
- [x] D14 – Gabinete (PAL/REI/IFTO): fixed lines + "Gabinete da Direção-Geral"; a "Reitoria" line is an error.
- [x] D15 – Copy signer names (18/11/2026, user): in SEI 5 the box "Documento assinado eletronicamente por …" cannot be selected; the extension makes it selectable on the document page (own switch, on by default). Nothing written to the SEI; the SEI's PDF is not changed.
- [x] D10 – The four new switches (process number, timbre, footer, spacing) start **on**.

## 4. Decided rules

- **Which lines:** "Processo nº:" at the top and, in Edital/Minuta, "(Processo Administrativo n° …)" in the title (the number there is an SEI link). Ofícios have no such line: nothing to check.
- **Process the document is in:** from the "Referência: Processo nº …" line the SEI adds below the document (view page), or from the process tree / the SEI window that opened the editor. Compared by digits only (dots, slash and dash ignored).
- **When it warns:** (1) document page in the process tree, only if not signed yet ("Documento assinado eletronicamente" absent), in the person's current unit; (2) editor window. Warning shows both numbers: "O documento está no processo X, mas o texto diz Y".
- **Fix:** button "Corrigir o número do processo" only in the editor (replaces only the number in the "Processo nº:" line); on the document page the button opens the editor. Never saves: the person clicks Salvar.
- **Before signing (process only):** window "O número do processo está errado (documento no processo X, texto diz Y). Assinar mesmo assim?" — "Assinar mesmo assim" lets the SEI sign normally; "Não" opens the editor with the warning (no automatic fix). Signature list and Bloco de assinatura: one window listing every wrong document.
- **Timbre (Palmas units):** fixed lines "Ministério da Educação / Secretaria de Educação Profissional e Tecnológica / Instituto Federal de Educação, Ciência e Tecnologia do Tocantins / Campus Palmas", then the unit's sector lines from the settings. Unit not in the list: only the fixed lines are checked.
- **Footer (Palmas units):** text of D4 with the unit's phone and e-mail; no phone → 63 3236-4000; no e-mail → palmas@ifto.edu.br. Links: `mailto:`, `https://palmas.ifto.edu.br`, `tel:+55633236xxxx`.
- Footer compared by data only (D11): digits of phone and CEP, e-mail, street parts; formatting differences are not warned. Invisible characters (zero-width, word joiner) and trailing spaces are ignored in the timbre.
- Timbre and footer: warning lists what differs; button "Corrigir timbre" / "Corrigir rodapé" in the editor; nothing changes without the click.
- **"Minhas unidades"** in the settings: several units (some people have 10), each with SEI sigla (e.g. CGOC/PAL/REI/IFTO), phone, e-mail and sector lines. Saved only in the browser.
- **Spacing (every type, 18/11/2026):** in the editor the extension measures the gap between the last line of each section and the first line of the next one; if it is under about half a line, it adds one blank line there (CSS rule for that pair of styles). Gaps inside a section (e.g. between timbre lines) are not touched. Where people already put an empty spacer paragraph, the gap is big enough and nothing is added. In the Despacho this gives: after the last timbre line, the document number, the date, the "Processo/Interessado/Assunto" block, and before the signer's name. Recognized by a comment like `extensao-ifto: espacamento` (as v0.25.0). Coexists with the numbering and MINUTA style blocks.
- Every feature has its own switch in the settings (all on by default) and works in every unit (timbre/footer: Palmas units only).

## 5. What changes

- Sites and pages: `sei.ifto.edu.br` only — document view in the tree, editor (`acao=editor_montar`), "Assinar" buttons (tree, editor), signature list, Bloco de assinatura. No new site or permission.
- Data read: the document text, the process number on the page, the current unit. Written: only the editor text, after the click (spacing: automatic, saved only with Salvar). Nothing to the spreadsheet.
- Screens: settings page reorganized + "Minhas unidades" + 4 switches; warning boxes on the document page and in the editor (`caixa-editor.js`); pre-sign window.
- Likely code: `comum/conferir-documento.js` (pure rules: find the "Processo nº" line, compare numbers, expected timbre/footer, spacing CSS) with tests; `sites/sei/` pages for view, editor and signing; reuse `comum/sei.js`, `sites/sei/caixa-editor.js`, `editor-numeracao.js` (style block), `lista-assinaturas.js`.

### Knock-on effects (noted)

- Documents where people already added blank lines by hand get double space: "Desfazer" in the box; the person can delete the extra Enter.
- If T123 shows the style block does not reach the PDF, spacing becomes blank lines (stage 7 waits for T123).
- Timbre/footer sections may be locked in the editor of some types: check in stage 6 with a saved editor page; if locked, only warn.
- Signing interception must never block signing when the check fails (SEI slow, text not read): then the SEI signs normally.

## 6. Stages

- [ ] Stage 1 – Settings page reorganized (side menu: Geral, Documentos do SEI, Minhas unidades, Direção-geral, SICAF e Simples, Licitação, Dicas, Ajuda) + "Minhas unidades" list + the 4 switches (v0.26.0). Test: open the settings, add two units, reload, data kept.
- [ ] Stage 2 – Copy signer names: the signature box on the document page becomes selectable (switch) (v0.26.1). Test: select and copy a name in a signed document.
- [ ] Stage 3 – Process number: warning on the document page (unsigned) and in the editor, "Corrigir" button in the editor, pure rule + Node tests (v0.26.2).
- [ ] Stage 4 – Pre-sign window: "Assinar Documento" in the tree and "Assinar" in the editor (v0.26.3). Critical test (signs in the SEI).
- [ ] Stage 5 – Pre-sign window in the signature list and in the Bloco de assinatura (v0.26.4). Critical test.
- [ ] Stage 6 – Timbre and footer: warnings, "Corrigir" buttons, "Usar este timbre como padrão da unidade" (v0.26.5).
- [ ] Stage 7 – Spacing in every type (gap detection, style block, automatic, "Desfazer") — after T123 (v0.26.6). Needs saved editor pages of Ofício and Memorando too. Critical test: saved Despacho and PDF; plus one test with an Ofício.

## 6b. Analysis of the saved pages (18/11/2026)

Saved documents in `ferramentas-de-teste/paginas-sei/` (development computer):
- Process line: Despacho 3390347 and Despacho 67/2026/CGOC correct; Minuta 3384558 has the process as an SEI link in the title.
- Timbre: Ofício 9/2026/**CGOC** has the GISE lines (copied); Despacho 67/2026/CGOC and Portaria 3390422 (CGOC number) have "Reitoria" without "Campus Palmas"; Ateste de serviços (SEI-ateste-nota-servicos) has no sector lines; Minuta 3384558 has an extra "Reitoria" line; Edital 3390039 has no "Gabinete da Direção-Geral". Invisible characters in some timbre lines.
- Footer: Reitoria footer (reitoria@, 4000) in Despacho 3390347, Despacho 67/CGOC, Portaria 3390422, Ateste de serviços; Ofício 9/CGOC has GISE e-mail and phone 4023; Ateste de serviços has "CEP Palmas/TO" (CEP number missing). Folhas de encaminhamento (CGOC) are right (only formatting differs).
- Spacing: header lines and "IFTO_Assinatura" use line-height 10% and the "sem espaço" styles have no margin, so number/date/process/recipient and the signer's name touch. Many documents already have empty spacer paragraphs (Ofício, Atestes, Editais, Portaria).
- Signature box: `unselectable="on"` and `user-select:none` (D15).

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T130 onward, in Portuguese).
