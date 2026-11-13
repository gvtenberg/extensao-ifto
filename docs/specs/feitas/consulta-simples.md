# Automatic Simples Nacional lookup (Consulta)

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** done, waiting for tests: stages 1 (v0.17.0), 2 (v0.17.2) and 3 (v0.18.0, together with the user's "one button" request of 13/11/2026; rules in `regras/sicaf.md`)
- **Requested on:** 13/11/2026 · **Deadline or priority:** next improvement after the automatic SICAF
- **Planned version:** 0.17.0 (stages: 0.17.0, 0.17.2, 0.17.3 — 0.17.1 was the icon-window fix; rule of 13/11/2026: stages of one feature keep the middle number)

## 1. Goal (what for)

Today, for each invoice, CGOC opens the Simples Nacional "Consulta Optantes", types the CNPJ without dots, clicks Consultar, Mais informações and Gerar PDF (a picture of the page, not searchable), goes back and types the next CNPJ, then attaches the PDF to the Consulta in the SEI by hand. The extension does the lookups for every pending supplier in the same "Buscar" click as the SICAF, builds a **searchable text PDF** and puts it in the Consulta.

## 2. Out of scope

- The hCaptcha check of the site: never solved or bypassed by the extension. If a picture puzzle appears, the user solves it and the extension continues.
- TCU consolidated lookup (used instead of the Simples in some processes): later idea in `melhorias-futuras.md` (13/11/2026).
- Warning when the invoice text and the lookup disagree about the Simples: not now.
- Showing "Optante / NÃO optante" in the confirmation window: not chosen (13/11/2026).

## 3. Decisions to confirm

- [x] D1 – Start (13/11/2026): **same "Buscar" button as the SICAF**; one click gets SICAF + Simples Nacional per pending supplier; one confirmation adds Sicaf, Consulta (with PDF) and Anexo.
- [x] D2 – PDF (13/11/2026): **the extension's own text PDF** (searchable in the SEI) with the page data, plus the line "Consulta feita em dd/mm/aaaa hh:mm no Portal do Simples Nacional (<address>)". The site's "Gerar PDF" is not used.
- [x] D3 – TCU (13/11/2026): Simples Nacional only now.
- [x] D4 – Result (13/11/2026): **keep it for the future Folha by reading the Consulta PDF in the SEI** (it has real text); nothing extra stored in the extension.
- [x] D5 – Copy (13/11/2026): PDF also saved in Downloads, like the SICAF: `ConsultaOptantes_<CNPJ 14 digits>_<yyyy-mm-dd>.pdf`.
- [x] D6 – Tree name (13/11/2026): **"Consulta Simples Nacional <Nome Empresarial from the result>"** (changes the plain "Consulta" of `sicaf-automatico.md` D3 when the PDF is attached).
- [x] D7 – Branch CNPJ (13/11/2026): type the **invoice CNPJ**; if the site refuses a branch, switch to the head office (first 8 digits + 0001 + recalculated check digits; same rule as the "branch without its own SICAF" idea — share the function).

## 4. Decided rules

- **Site:** the form is `https://consopt.www8.receita.fazenda.gov.br/consultaoptantes` (shown inside `www8.receita.fazenda.gov.br/simplesnacional/aplicacoes.aspx?id=21`); the extension opens the form address directly. CNPJ field: 14 characters, no dots (`#consultarForm`); button with hCaptcha (`data-callback="onSubmit"`).
- **Result page** (sample `ferramentas-de-teste/simples-nacional/Simples Nacional2_files/ConsultarCnpj_ZwC_.html`): "Data da consulta", "CNPJ" (head office), "Nome Empresarial", "Situação no Simples Nacional", "Situação no SIMEI", "Situação no Regime Regular do IBS/CBS", "Períodos Anteriores", "Eventos Futuros"; "Mais informações" (`#btnMaisInfo`) loads more data (`/consultaoptantes/Home/AjaxMaisInfo`); wait for it before reading. "Voltar" goes back to the form.
- **Text PDF:** A4, same order and labels as the page (including "Mais informações"), accents kept, plus the source line from D2. Built by the extension (no outside service). Old picture sample: `ferramentas-de-teste/simples-nacional/ConsultaOptantes.pdf`.
- **Several suppliers:** one tab, one CNPJ after the other (form → result → Mais informações → read → back); each supplier only once per "Buscar".
- **Captcha:** if a puzzle appears, a notice in the tab: "Resolva a verificação para continuar"; the extension waits and continues by itself.
- **50-character limit (13/11/2026, every SEI external document):** the SEI field "Nome na Árvore" accepts at most 50 characters (`maxlength="50"` in `ferramentas-de-teste/paginas-sei/SEI-registrar-documento-externo.html`; the type "Consulta" is not counted). Use the existing `nomeNaArvore()` (`comum/sicaf.js`, v0.14.0, also used by `nomeDoSicaf` and `nomeDoAnexo`: cuts at the last whole word, drops a final dot/comma). E.g. "Simples Nacional HM COMERCIO IMPORTACAO E EXPORTACAO LTDA." (58) → "Simples Nacional HM COMERCIO IMPORTACAO E" (≤ 50). In stage 1, after the SICAF spec is closed: move `nomeNaArvore()` to `comum/sei.js` and the rule to `docs/regras/sei.md` (it applies to every external document, not only SICAF), with a test.
- **Nothing in the SEI before the confirmation** (`CLAUDE.md`, Conventions); the Consulta gets the PDF only after the user confirms.

## 5. What changes

- Sites: new `consopt.www8.receita.fazenda.gov.br/*` (optional permission, asked only when the SICAF option is on).
- Data read: lookup result page. Written: PDF in the Consulta (SEI, after confirmation) and in Downloads.
- Screens: notice on the lookup tab (captcha / progress); the existing SICAF confirmation window also lists the Simples PDF per supplier.
- Likely code: `comum/simples-nacional.js` (read the result text, file name, tree name), `comum/pdf-texto.js` (small text PDF maker, works in Node for tests), `sites/simples-nacional/consulta.js`; reuse the SICAF tab and background flow, `comum/sicaf.js` (CNPJ rules) and `comum/documento-externo.js`.

## 6. Stages

Each stage fits in a short conversation (`/etapa consulta-simples <n>`) and ends with tests, version and commit. Prerequisite: `sicaf-automatico.md` finished.

- [x] Stage 1 – **Read the result and make the text PDF** (v0.17.0; sample `ferramentas-de-teste/simples-nacional/exemplo-ConsultaOptantes_14159957000190_2026-11-13.pdf`): rules for the result page and the PDF maker, automated tests with the saved page; the test writes a sample PDF to `ferramentas-de-teste/simples-nacional/` for the user to open and search (Ctrl+F) the CNPJ.
- [x] Stage 2 – **Lookup on the site** (v0.17.2; runs after the SICAF in the same tab of the same "Buscar"; PDFs only in Downloads until stage 3; today's lookups kept in `storage.local` `simplesPdfs`, like `sicafPdfs`): permission, open the form, fill the CNPJ, Consultar, captcha notice, Mais informações, read, PDF, Voltar, next CNPJ; branch → head office when refused (D7). Critical test (does the site accept the automatic search, how often the captcha appears, branch CNPJ).
- [x] Stage 3 – **Together with the SICAF and into the SEI** (v0.18.0; also: blank-documents button and setting removed, "Sempre ligada" = only "Incluir SICAF" with the Sicaf, selected CNPJ outside the CGOC = "Incluir SICAF" / "Incluir Simples Nacional"; tests T78 to T82): the "Buscar" click also runs the Simples lookups; confirmation window lists the PDF; Consulta with the PDF and tree name from D6; copy in Downloads. A blank Consulta after the last Folha (reused since v0.16.0 and today "left as is") also gets the PDF and the name through "Alterar Documento Externo"; a supplier with a Consulta **with a file** after the last Folha whose PDF has its CNPJ is already done (same rule as the Sicaf). Update `docs/regras/sicaf.md` (Consulta no longer blank). Critical test (writes to the SEI).

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
