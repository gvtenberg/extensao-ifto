# Extension base and SEI improvements

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** in progress (stage 1 done in v0.1.0); next: stage 2, which depends on D7 and D9 to D13
- **Requested on:** 25/10/2026 · **Deadline or priority:** the extension's first improvement; start now (the signature list, `feitas/lista-assinaturas.md`, came before stage 2 by the user's decision on 12/11/2026)
- **Planned version:** one version per stage (versions 0.2 to 0.5 went to the signature list; the next stage here takes the next free number)

## 1. Goal (what for)

Bring back to the IFTO SEI the SEI++ features that CGOC used (SEI++ stopped working) and go further: pre-filled external document, dragged files with the document type recognized, and **checklists** with the documents each process type needs (e.g. payment, commitment top-up). It works when CGOC builds a payment or top-up process without filling the external document fields by hand and without forgetting a document.

## 2. Out of scope

- Google login and reading the system spreadsheet (next spec).
- Checklist steps filled with data (routing sheet with the invoice data and SEI numbers; commitment note request with system data): depend on login; another spec.
- Automatic PDF compression inside the extension (see `melhorias-futuras.md`).
- Other sites (Comprasnet, Contratos.gov, SIAFI, SUAP, SICAF, Simples Nacional).
- Chrome and Mozilla signing (done separately: v0.1.1 and v0.5.0, `publicacao.md`).

## 3. Decisions to confirm

Claude does not code while there is a `[ ]` that affects the stage. The user marks `[x]` and writes the answer, or strikes the question.

- [x] D1 – Which is the IFTO SEI version (footer or login page)? Affects stages 2 onward (field names change between versions).
  - Answer: **SEI 5.0.4** (scripts `?5.0.4-2.45.1` in the pages saved on 10/11/2026; the SEI was updated in 11/2026). Stages 2 onward are built for SEI 5; reference pages live in `ferramentas-de-teste/paginas-sei/` (outside git).
- [ ] D2 – Besides this spec's features, which other SEI++ features were useful (T01 and T02)? They go into an extra stage at the end.
  - Answer:
- [x] D3 – License: reusing code from SEI++ (GPL-3.0) and SEI Pro (AGPL-3.0) makes the extension GPL-3.0 (the code stays open if it is ever distributed). Is that OK? Affects stage 1.
  - Answer: yes, GPL-3.0 (25/10/2026).
- [x] D4 – How the code is written. Claude's suggestion: plain JavaScript, no build step (like SEI++; its code can be reused almost as is), in the new extension format (Manifest V3, the same Chrome requires), for Firefox 128 or newer. Affects stage 1.
  - Answer: plain JavaScript, Manifest V3, Firefox 128 or newer (25/10/2026).
- [x] D5 – Where settings, process types, checklists and each process's mark are stored. Claude's suggestion: in the browser itself (works without login), with "Export" and "Import" to a file, for backup and for passing to colleagues; in the spreadsheet only after login (another spec). Affects stage 1.
  - Answer: in the browser, with Export and Import to a file (25/10/2026).
- [ ] D6 – External document date when dragging: today's (SEI++) or the file's modification date (SEI Pro)? Claude's suggestion: today's by default, with an option in the settings. Affects stage 3.
  - Answer:
- [ ] D7 – Which "other fields" of the external document come pre-filled? SEI options: number/name in the tree, sender, interested parties, description, notes. Affects stage 2.
  - Answer:
- [ ] D8 – How does the extension know a checklist step is done? Claude's suggestion: the process tree has a document of the step's type (e.g. a "SICAF" after the last invoice). In payment processes, which receive several invoices, does each new invoice restart the checklist? Affects stage 4.
  - Answer:
- [ ] D9 – Which characters the SEI does not accept in the file name (at least "#") and what to do with them: replace with "_" (like SEI Pro), with a space, or remove? And do accents stay? Survey in T06. Affects stages 2 and 3.
  - Answer:
- [ ] D10 – Is the SEI limit 10 MB (10,000,000 bytes) or 10 MiB (10,485,760 bytes)? Survey in T07. Affects stages 2 and 3.
  - Answer:
- [ ] D11 – A **non-PDF** file above the limit (spreadsheet, image, video…): which tip to show (zip it, split it, convert to PDF)? Question P1 in `TESTES-PENDENTES.md`. Affects stages 2 and 3.
  - Answer:
- [ ] D12 – Compression tip also **below** the limit (to save space on the Rectorate server): from what size? Question P2. Affects stages 2 and 3.
  - Answer:
- [ ] D13 – pdf24.org and ilovepdf receive the file on their servers. Does the tip apply to **restricted or confidential** documents? Question P3. Affects stages 2 and 3.
  - Answer:

## 4. Decided rules

Decided in the conversation of 25/10/2026:

- **GPL-3.0 license** (D3); code in **plain JavaScript**, no build step, Manifest V3, Firefox 128 or newer (D4); settings, process types, checklists and process marks **in the browser**, with export/import to a file (D5).

- **Base:** the SEI++ code (commit c53f1367 and version 5.1.1, see `docs/referencias/seipp.md`); SEI Pro (https://github.com/SEI-Pro/sei-pro) as a reference for improvements and other ways of doing the same things.
- **"Novo documento" button always visible** in the process tree action bar (like SEI++). Removed in v0.6.0 (SEI 5 always shows it).
- **Pre-filled external document:** on the external document page, the extension fills in today's date, access level (default: public; restricted/confidential with the legal basis), format (born-digital, or scanned with the type of check) and **document type**, with the default values chosen by the user in the settings. It shows the message "valores preenchidos pela extensão: confira". **It never clicks Save.**
- **Drag files into the process** (creates one external document per file, like SEI++ and SEI Pro). Each file's document type comes, in this order:
  1. from the process checklist's **next pending step** (when the process has a checklist);
  2. from the **file name**: it starts with the name of an SEI type (e.g. "Nota Fiscal 123.pdf" → type Nota Fiscal, name "123") or matches a user rule (e.g. "contains SICAF → Certidão");
  3. from the settings' **default type**;
  4. with none of these, the extension **asks**.
- **Check before sending:** since sending writes directly to the SEI, the extension shows the list of files with each one's type and name, to fix or remove any, and only sends after confirmation.
- **Process types and checklists:** process types are **registered in the extension** (the SEI type is not used, because many processes were registered with the wrong type). Each type has a checklist: the list of steps, each with the SEI document type and whether it is external (file) or made in the SEI. In each process, the user picks the extension's process type; the choice is saved by process number.
- **Checklist view:** in a process with a checklist, the extension shows the steps done and those missing. A slow step (e.g. the commitment PDF, after the signatures) stays pending until attached.
- **File name (26/10/2026):** settings option to **remove from the file name the characters the SEI does not accept** (at least "#"; the list comes from T06, D9), when dragging and on the external document page.
- **File size (26/10/2026):** the SEI only accepts files up to **10 MB** (applies to **all file types**; MB or MiB: D10). Above the limit, the extension **does not send** and warns that compressing first is mandatory, with tips: for PDF, **pdf24.org** compresses much better than ilovepdf for some file types; for other types, D11. The tips also appear on the external document page when choosing the file.
- **Example checklists** (the user adjusts them):
  - **Payment (CGOC):** invoice and invoice certification (arrive at the department); SICAF; Simples Nacional status lookup; Contratos.gov billing document attachment; routing sheet with the invoice data and the SEI documents.
  - **Commitment top-up:** available SIAFI credit (external); commitment note request (budget system data, after login); commitment PDF (after the signatures, days later).

## 5. What changes

- **Sites and pages:** only the IFTO SEI: process tree (Novo documento button, drag files, checklist view), external document page (`acao=documento_receber`).
- **Data read or written:** only the SEI (external documents, after confirmation) and the browser itself (settings and checklists, D5).
- **Extension screens:** settings page (external document defaults, file-name rules, process types and checklists, export/import); icon window with the process type of the open process.
- **Likely code files:** `manifest.json`, `sites/sei/` (one part per SEI page), `configuracoes/`, `janela/`, `comum/` (type-by-name and next-step rules, with automated tests).

## 6. Stages

Each stage fits in a short conversation (`/etapa base-e-sei <n>`) and ends with tests, version and commit.

- [x] Stage 1 – **Skeleton and Novo documento button.** (done in v0.1.0, 26/10/2026; the extension acts only on `*.ifto.edu.br` addresses — `sei.ifto.edu.br` only since v0.2.0; the button is added on any SEI version when it is missing from the bar, not only before SEI 4 as in SEI++) Installable extension (manifest, icon, icon window, empty settings page), `web-ext` commands in CLAUDE.md, recognition of the SEI and its version, "Novo documento" button always visible. Depends on D3, D4, D5. Test: temporary install; open a process in the SEI and see the button.
- [ ] Stage 2 – (v0.6.0 already fills today's date, Nato-digital and Público on new external documents: `specs/documentos-pagamento.md`) **Pre-filled external document.** Settings with default values (access level, legal basis, format, type of check, document type and the D7 fields); filling and on-screen message; when choosing the file, name without the characters the SEI does not accept and size warning with compression tips. Depends on D1, D7, D9 to D13. Test: open "Incluir documento › Externo" and see the fields filled, without saving.
- [ ] Stage 3 – (12/11/2026: an IFTO colleague already adds files directly to a process on SEI 5 with their own extension; check how before starting) **Drag files.** Drop area on the tree; type by file name, user rules and default; asks when not recognized; check list before sending, with each file's size (above the limit: does not send and shows the tips); names without the characters the SEI does not accept, with correct accents and dashes. Depends on D1, D6, D9 to D13. Test (critical, writes to the SEI): drag three files into a test process.
- [ ] Stage 4 – **Process types and checklists.** Register types and steps; choose the open process's type; checklist of steps; dragging suggests the type of the next pending step. Depends on D8. Test: register the payment checklist, mark a process and see what is missing.
- [ ] Stage 5 – **Export and import** settings and checklists to a file. Test: export, delete, import.
- [ ] Stage 6 – (if D2) other SEI++ features.

**After this spec:** login and reading the spreadsheet; checklist steps with data (routing sheet, commitment note request).

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese). Before: T01 and T02 (survey of SEI++ features on the IFTO SEI). Critical test: the first upload of dragged files (stage 3).
