# Signature list in the SEI

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** done (v0.2.0 to v0.4.0, 12/11/2026; "Assinar e próximo" added in v0.5.0)
- **Requested on:** 12/11/2026 · **Deadline or priority:** do now, before stage 2 of `base-e-sei.md` (does not depend on it)
- **Version:** 0.2.0 to 0.5.0

## 1. Goal (what for)

The user receives a list of processes and documents to sign or only acknowledge (e.g. `23236.021417/2026-95 - 3383423 dar ciência`). Before, they looked each one up in the SEI. Now they paste the list into a floating panel in the SEI and move item by item, seeing the counter (8/28) and what is left. It works when a 28-item list is signed without typing any number.

## 2. Out of scope

- Storing the SEI password in the extension (decided on 12/11/2026: it stays in the Firefox password manager).
- Several named lists, or taking the list to another computer or to the spreadsheet.
- Opening the documents of the SEI's own signature block (another SEI feature).

## 3. Decisions to confirm

None open (all answered in the chat on 12/11/2026).

## 4. Decided rules

Moved to `docs/regras/lista-assinaturas.md` (single source). Extra decisions from 12/11/2026: the extension acts only on `sei.ifto.edu.br` (`docs/regras/sei.md`); the feature belongs to the Director-General's office (`PAL/REI/IFTO`), with the settings option Automática / Sempre ligada / Desligada; future standard profiles per unit are an idea in `melhorias-futuras.md`; "Assinar e próximo" signs with the password Firefox fills in and the user's click is the confirmation (v0.5.0).

## 5. What changed

- Sites and pages: every full IFTO SEI page (`sei.ifto.edu.br`, with the unit field); the signing window (`acao=documento_assinar`) for "Assinar e próximo".
- Data: only in the browser (`storage.local`, key `listaAssinaturas`). In the SEI the extension fills the quick search and clicks the SEI's own "Assinar Documento", "Ciência" and "Assinar" buttons at the user's request.
- Screens: floating panel and small button on SEI pages; one option in the settings. `padrao-visual.md`: panel and the "Automática" exception.
- Code: `comum/lista-assinaturas.js` + `testes/lista-assinaturas.test.js`; `sites/sei/lista-assinaturas.js`, `lista-assinaturas-teclas.js`, `assinar-e-proximo.js`; `manifest.json`; settings.

## 6. Stages

- [x] Stage 1 – **Read the list and open one by one** (v0.2.0, 12/11/2026). Restrict the extension to `sei.ifto.edu.br`; read the open unit and show the feature only in `PAL/REI/IFTO`; parsing rule with tests; button and panel: paste, red lines, save, counter, Previous/Next, open via quick search, drag (default to the right of the button bar), clear list.
- [x] Stage 2 – **Done, full list and comfort** (v0.3.0, 12/11/2026). "Feito e próximo", done counter, clickable full list, highlighted comment and acknowledgement color, minimize, Alt+→/Alt+← shortcuts, settings option.
- [x] Stage 3 – **"Assinar" and "Dar ciência" buttons in the panel** (v0.4.0, 12/11/2026). They click the SEI's own buttons.
- [x] After the spec – **"Assinar e próximo" / "Dar ciência e próximo"** (v0.5.0, 12/11/2026), replacing "Feito e próximo" and the separate buttons for items with a document or acknowledgement.

## 7. Manual tests

T13 to T20 and T23 to T25 in `TESTES-PENDENTES.md` (in Portuguese).
