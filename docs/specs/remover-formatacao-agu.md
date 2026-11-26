# "Remover Formatação da AGU" button

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** ready to code (after `feitas/numeracao-caixas-ocultas.md` (v0.37.0), which creates the shared review panel)
- **Requested on:** 26/11/2026 · **Deadline or priority:** second, after the numbering fix (user, 26/11/2026)
- **Planned version:** next middle number at stage 1

## 1. Goal (what for)

Documents of a bidding process (Edital, Termo de Referência, Minuta de Ata, Minuta de Contrato…) go to the AGU (procuradoria) with marks: struck text, red/blue/green text and comments. When they come back, the CCL removes all of it by hand, which is slow and easy to get wrong. One button removes the marks, after the person reviews the list. It worked when the result matches the "-final" versions made by hand (`ferramentas-de-teste/paginas-sei/*-formatacao-agu.html` vs `*-final.html`), without the hand mistakes.

## 2. Out of scope

- Copying these documents to Compras.gov automatically (soon, separate idea in `ideias.md`).
- Bold and underline (they may be part of the official text; user, 26/11/2026).
- Other hand edits seen in the finals (timbre "Gabinete da Direção", "minuta de EDITAL" title: the MINUTA mark has its own feature).
- Saving: the extension never saves.

## 3. Decisions to confirm

None open (all answered on 26/11/2026, see 4).

## 4. Decided rules

- **What the samples show (26/11/2026):** struck text is `<s>` (86 in Edital 3399512, 49 in Contrato 3399534, 29 in Ata 3399532, 2 in TR 3399516); colors `red`/`#FF0000`, `#0070C0` (blue), `#00B050` (green), some `#0000EF`; the "comments" are paragraphs with only "Justificativa Modificação Item(ns)" (22 in the Edital, 6 in the Ata, 14 in the Contrato, in yellow highlight with a Word comment link `<a href="#_msocom_N">`). Paragraphs fully struck were deleted in the finals (78 in the Edital). The finals still have a few marks left by hand (e.g. 1 "Justificativa…", 2 red in the Edital).
- **D1 – Name and place (user):** "Remover Formatação da AGU", a section of the single notice window in the editor (with title, footer, date, numbering…), shown only when the text has AGU marks.
- **D2 – Setting (user):** in the settings section "Licitação (CCL)": Automática (only in the CCL, same unit check as the Compras IFTO pieces) / Sempre ligada / Desligada. The editor window gets the unit from `infra_unidade_atual` (like the MINUTA mark).
- **D3 – Struck text:** removed (`<s>`, `<strike>`, `<del>`, `text-decoration: line-through`; in the editor model, the `strikethrough` attribute). If removing it joins two words, one space is added (the strike is done by hand and may miss a space): space added only when the character before is not a space or an opening bracket and the character after is not a space or punctuation (`, . ; : ) ]`); two spaces left become one.
- **D4 – Struck paragraph (user):** a paragraph left with no text after removing the struck parts is deleted. Empty paragraphs that were already there stay.
- **D5 – Colors (user):** all text becomes black (text color removed), links keep their color; text highlight (yellow etc., `marker-*`) removed; table cell shading and the grey band of titles (style classes) stay.
- **D6 – Comments (user: both kinds):** (a) paragraphs whose whole text is "Justificativa Modificação Item(ns)" (spaces, capitals and accents ignored) are deleted, and Word comment links `#_msocom_N` removed; (b) the SEI comment balloons (editor "Comentários" panel, `plugins.get('Comentario')`) are deleted.
- **D7 – Balloons deleted at once (user):** if the SEI deletes a balloon on the server right away (it has its own "excluir" address) instead of on Salvar, the balloons have their own part in the list with a red note "os comentários são apagados do SEI na hora, sem desfazer" and an extra confirmation. If they only go on Salvar, no extra warning. To check in stage 3.
- **D8 – Review before removing (user, 26/11/2026):** the panel is an extension window, so it **never opens by itself** (user, 26/11/2026): only the click on "Remover Formatação da AGU" in the notice window opens the shared left side panel (from `feitas/numeracao-caixas-ocultas.md`) with everything that will be removed, all ticked: each struck excerpt (with a few words around), each "Justificativa…" paragraph, each balloon; colors as one line "N trechos coloridos ficarão pretos" (and highlights as one line). Clicking a line scrolls the editor to it and highlights it; untick to keep. Button "Remover os marcados", then a short summary. Never saves; Ctrl+Z or closing without saving undoes (except D7).

## 5. What changes

- Sites and pages: SEI editor window (`acao=editor_montar`), any document type, units per D2.
- Data read or written: only the text in the editor; balloons per D7.
- Extension screens: settings ("Licitação (CCL)" section, new choice), notice window section, review panel.
- Likely code files: new `comum/formatacao-agu.js` (pure rules: find marks, space rule, "Justificativa" text) with Node tests (`testes/`, small snippets from the samples); new `sites/sei/formatacao-agu.js`; `sites/sei/painel-revisao.js` (reused); `comum/configuracoes.js`, `configuracoes/index.html`; `manifest.json` (script list); `docs/regras/sei-editor.md`; README.

## 6. Stages

- [ ] Stage 1 – Pure rules + Node tests (struck text with space rule, empty paragraph, colors except links, highlights, "Justificativa" paragraphs, `#_msocom` links); local script in `ferramentas-de-teste/` comparing the result on the 4 samples with the finals (not in git).
- [ ] Stage 2 – Setting, notice window section, review panel and removal in the editor model (struck text, paragraphs, colors, highlights, "Justificativa"). Test: Edital 3399512 and Contrato 3399534 in the editor, untick one item, remove, check before Salvar.
- [ ] Stage 3 – SEI comment balloons: ask the user to save the editor page of a document that has balloons (the TR samples had none saved); check whether deleting is immediate (D7); list and delete. Test (critical if deletion is immediate).
- [ ] Stage 4 – README (Portuguese), rules to `docs/regras/sei-editor.md`, spec to `specs/feitas/`.

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
