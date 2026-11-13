# Automatic SICAF in the SEI

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** in progress (stages 1–4 done, v0.13.0)
- **Requested on:** 13/11/2026 · **Deadline or priority:** high (done for every invoice that arrives for payment)
- **Planned version:** 0.10.0

## 1. Goal (what for)

For every invoice, CGOC today logs in to Compras.gov.br (gov.br + SerproID + code), opens the SICAF, searches the CNPJ, downloads the "Situação do Fornecedor" PDF and attaches it to the SEI by hand. The extension finds the invoices that still need a SICAF, gets the PDF from the SICAF and, after one confirmation, adds Sicaf (with the PDF) and Consulta per supplier and one Anexo per invoice. Any other sector (e.g. Licitação) can turn on a simple "Incluir SICAF" button. Selecting a CNPJ (or right-clicking it in the invoice PDF) also starts it.

## 2. Out of scope

- The gov.br login itself (QR code in SerproID and the 6-digit code): personal identity, cannot and must not be automated. The extension only opens the right page and takes over after the login.
- Filling Consulta and Anexo with PDFs (Simples Nacional / TCU lookup, Contratos billing document): later improvement (line in `melhorias-futuras.md`).
- Reading scanned invoices (image without text): the user types or picks the CNPJ.

## 3. Decisions to confirm

- [x] D1 – CNPJ source: **invoice PDF, checked against the ateste** (13/11/2026). If they differ, or the invoice has no text, a window shows both and the user picks or types the CNPJ.
- [x] D2 – Start: **notice + one click** (13/11/2026): the extension bar shows "N notas sem SICAF – Buscar"; nothing opens before the click.
- [x] D3 – Tree name: **Sicaf with the supplier name** (13/11/2026), e.g. "Sicaf Empresa X Ltda" (name from the SICAF result). Consulta keeps the plain name (13/11/2026).
- [x] D7 – Anexo (13/11/2026): **one per invoice**, tree name "Instrumento de Cobrança NF nº <number without leading zeros> <supplier as in the invoice tree name>" (e.g. "Anexo Instrumento de Cobrança NF nº 63 CHC SOLUÇOES EM SERV. E COM. LTDA").
- [x] D4 – Other sectors (13/11/2026): option "Incluir SICAF" in the settings, same pattern as the signature list (Automática / Sempre ligada / Desligada). Automática = on only in the CGOC unit (with invoice detection and the three documents). Sempre ligada = any unit gets the "Incluir SICAF" button (type or paste the CNPJ; adds only the Sicaf).
- [x] D6 – Selected CNPJ (13/11/2026): **also** a manual way, besides the automatic reading (D1). Selecting a CNPJ on an SEI page shows a small button next to it; in the invoice PDF (browser PDF viewer, where extensions cannot run) the right-click menu "Buscar SICAF deste CNPJ"; fallback: paste the CNPJ in the "Incluir SICAF" field. **No list**: it acts right away on that CNPJ — CGOC: "Incluir Sicaf, Consulta e Anexo"; other units: "Incluir SICAF".
- [x] D8 – Checks (13/11/2026): ateste and Folha are typed by hand and error-prone, so the **invoice is the reference**. Checked: tomador CNPJ is Campus Palmas **10.742.006/0003-50** (another 10.742.006/… = another IFTO unit, e.g. Reitoria 0001-98); ateste × invoice: CNPJ, company name, invoice number, value (R$) and empenho (empenho only when the invoice mentions one).
- [x] D9 – On mismatch (13/11/2026): **red warning, user decides**. Another IFTO unit, no Campus Palmas CNPJ, or different CNPJ / number / value / empenho → red, needs a second click "Continuar mesmo assim"; company name difference → yellow notice only (names are abbreviated).
- [x] D10 – Forwarded invoices (13/11/2026): by **position in the tree** (everything after the last Folha de Encaminhamento is pending).
- [x] D5 – PDF copy (13/11/2026): the SICAF PDF goes into the SEI **and** is saved in Downloads with the SICAF's usual name (`consultarSituacaoFornecedor_<CNPJ>_<yyyy-mm-dd>.pdf`).

## 4. Decided rules

- **Tree names (saved process, 13/11/2026):** invoice = external PDF "Nota fiscal nº <n> <supplier>"; ateste = SEI-made document starting with "Ateste" (e.g. "Ateste Fatura Materiais"); one ateste may cover several invoices of the same supplier, or each invoice has its own; "Folha de Encaminhamento <n>" covers every invoice since the previous Folha. Older folders are closed; the newest one is open.
- **Ateste text (samples `ferramentas-de-teste/paginas-sei/SEI-ateste-nota-materiais.html` and `-servicos.html`):** lines "Empresa:", "CNPJ:", "Número da nota fiscal: 3.626 ( 3384844 )" (materials ateste also gives the invoice SEI number; services does not), "Nota de Empenho:" / "Número do empenho:", "Valor da nota fiscal:". One ateste may cover several invoices of the same supplier.
- **How to compare:** take each ateste item and look for it in the invoice text, ignoring dots, leading zeros, accents and case (063 = 63, 3.626 = 3626; values as "914,60"). Names: compare the main words, abbreviations allowed ("SERV." = "SERVIÇOS").
- **Pending invoices:** in the process tree, invoices and atestes that come **after the last "Folha de encaminhamento"** (or all of them, if there is none) still need documents. One set per **distinct supplier** (CNPJ).
- **Supplier CNPJ in the invoice:** formatted CNPJs with valid check digits, ignoring the IFTO ones (10.742.006/…); the first one left is the supplier (emitente comes first; a carrier's CNPJ may come later). Checked against the ateste. All 7 samples in `ferramentas-de-teste/notas-fiscais/` have text.
- **Supplier already done:** a Sicaf with a file after the last Folha de encaminhamento whose PDF has that CNPJ (the extension reads the attached PDF; names differ between invoice and SICAF, e.g. "CHC SOLUÇOES EM SERV. E COM." × "CHC SOLUCOES EM SERVICOS E COMERCIO") → no new Sicaf/Consulta. Invoice already done: an Anexo after the last Folha with its number.
- **Documents:** per supplier Sicaf (with the PDF, tree name "Sicaf <name from SICAF>") and Consulta (blank, plain); per invoice one Anexo (blank, name in D7). Same fields as the existing one-click creation (`specs/documentos-pagamento.md`). Example: CHC invoices 63 and 64 → Sicaf, Consulta, Anexo 63, Anexo 64.
- **Confirmation:** one window lists each supplier, CNPJ and the PDF obtained; nothing is written to the SEI before the user confirms (`CLAUDE.md`, Conventions).
- **Selected CNPJ:** only text matching a CNPJ (14 digits, with or without dots) triggers the button or menu; the CNPJ is checked (verification digits) before use.
- **SICAF link (stage 4, 13/11/2026):** not found in the saved Compras desktop (menu loaded later). The extension opens the SICAF page directly after the login; if the SICAF still says "acesso negado", it shows a notice asking to open SICAF from the user menu, and continues by itself when any SICAF page opens. T55 confirms which case happens.
- **PDF from the SICAF (stage 4):** "Situação do Fornecedor" sends the form through a hidden "abrirRelatorio" button; the extension catches that submit and repeats the same request to receive the PDF. Today's PDFs are kept per CNPJ (same day = no new search).
- **Login:** if the SICAF sends to `acessoNegado.jsf`, the extension opens the Compras login page (`comprasnet.gov.br/seguro/loginPortalUASG.asp`), highlights "Entrar com gov.br" (Governo) and waits; after the login it goes to the SICAF by itself and continues.
- **Access to other sites:** asked only when the option is on (optional permission), so colleagues who do not use it are never asked.

## 5. What changes

- Sites: `sei.ifto.edu.br` (as today); new: `www3.comprasnet.gov.br/sicaf-web/*` and the Compras login page (`comprasnet.gov.br/seguro/*`, and the Compras desktop if needed to reach the SICAF).
- Data read: process tree, ateste text, invoice PDF (text), SICAF result and PDF. Written: SEI external documents (after confirmation); PDF in Downloads.
- Screens: button next to a selected CNPJ and right-click menu item; extension bar notice and "Buscar" button (CGOC); "Incluir SICAF" button (any unit with Sempre ligada); confirmation window; CNPJ window when invoice and ateste differ; option in the settings; a small notice on the Compras login page.
- Likely code: `comum/sicaf.js` (CNPJ rules, tree rules, file name), `sites/sei/sicaf.js`, `sites/sicaf/*.js`, `sites/compras/login.js`, a background script to pass the PDF between tabs, a PDF text reader (pdf.js, loaded only when needed), `manifest.json` (optional host permissions, `downloads`, `menus`/`contextMenus`). Reuse `comum/documentos-pagamento.js` and `comum/documento-externo.js`.

## 6. Stages

Each stage fits in a short conversation (`/etapa sicaf-automatico <n>`) and ends with tests, version and commit. Prerequisite: T36 (creating the three payment documents); the saved process shows the three blank documents created by the extension.

- [x] Stage 1 – **Find pending invoices** (v0.10.0): option "Incluir SICAF" in the settings; in the CGOC unit, read the tree (invoices, atestes, Folha de encaminhamento, existing Sicafs) and the ateste CNPJ; notice "N notas sem SICAF – Buscar" in the bar (button does nothing yet). Saved tree (13/11/2026): `ferramentas-de-teste/paginas-sei/SEI - Árvore Montar.html` (ISO-8859-1; process 23236.023830/2025-11: CHC invoices 3375105/3375106, atestes 3375107/3375110, Sicaf 3376789, Consulta 3376790, Anexos 3376791/3376792, Folha 269 = 3376800; then HM invoice 3.626 = 3384844, ateste 3384848 and blank Sicaf/Consulta/Anexo 3385629–31 → HM pending, CHC done).
- [x] Stage 2 – **Selected CNPJ** (v0.11.0): button next to a CNPJ selected on SEI pages, right-click menu "Buscar SICAF deste CNPJ" (check it works in the Firefox and Chrome PDF viewers), paste field; CNPJ check digits. Until stage 4 the action only shows the CNPJ found.
- [x] Stage 3 – **CNPJ from the invoice and checks** (v0.12.0; D8, D9): read the invoice PDF text, compare with the ateste, window to pick or type when they differ or the invoice is a scanned image. Samples: `ferramentas-de-teste/notas-fiscais/` (7 models; `2026NE174.pdf` is a commitment note with two CNPJs of the same company).
- [x] Stage 4 – **Get the PDF from the SICAF** (v0.13.0): permission request, open the SICAF tab, login page help, fill CNPJ, Pesquisar, get the PDF (and supplier name), save it in Downloads and return it to the SEI tab. SICAF PDF sample: `ferramentas-de-teste/pagina-compras/consultarSituacaoFornecedor_14159957000602_2026-11-13.pdf`. **Before:** confirm the SICAF link from the Compras desktop (user menu › SICAF). Critical test (decides whether the SICAF accepts the automatic search).
- [ ] Stage 5 – **Add to the SEI** (v0.14.0): confirmation window; per supplier Sicaf with the PDF and tree name + Consulta + Anexo. Critical test (writes to the SEI).
- [ ] Stage 6 – **"Incluir SICAF" for any sector** (v0.15.0): with Sempre ligada, button in the bar of any unit: type or paste the CNPJ → SICAF → only the Sicaf with the PDF.

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
