# Automatic SICAF in the SEI

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** ready to code (stage 1 needs the saved pages listed in "Before")
- **Requested on:** 13/11/2026 · **Deadline or priority:** high (done for every invoice that arrives for payment)
- **Planned version:** 0.10.0

## 1. Goal (what for)

For every invoice, CGOC today logs in to Compras.gov.br (gov.br + SerproID + code), opens the SICAF, searches the CNPJ, downloads the "Situação do Fornecedor" PDF and attaches it to the SEI by hand. The extension finds the invoices that still need a SICAF, gets the PDF from the SICAF and, after one confirmation, adds Sicaf (with the PDF), Consulta and Anexo to the process. Any other sector (e.g. Licitação) can turn on a simple "Incluir SICAF" button.

## 2. Out of scope

- The gov.br login itself (QR code in SerproID and the 6-digit code): personal identity, cannot and must not be automated. The extension only opens the right page and takes over after the login.
- Filling Consulta and Anexo with PDFs (Simples Nacional / TCU lookup, Contratos billing document): later improvement (line in `melhorias-futuras.md`).
- Reading scanned invoices (image without text): the user types or picks the CNPJ.

## 3. Decisions to confirm

- [x] D1 – CNPJ source: **invoice PDF, checked against the ateste** (13/11/2026). If they differ, or the invoice has no text, a window shows both and the user picks or types the CNPJ.
- [x] D2 – Start: **notice + one click** (13/11/2026): the extension bar shows "N notas sem SICAF – Buscar"; nothing opens before the click.
- [x] D3 – Tree name: **Sicaf with the supplier name** (13/11/2026), e.g. "Sicaf Empresa X Ltda" (name from the SICAF result). Consulta and Anexo keep the plain name (13/11/2026).
- [x] D4 – Other sectors (13/11/2026): option "Incluir SICAF" in the settings, same pattern as the signature list (Automática / Sempre ligada / Desligada). Automática = on only in the CGOC unit (with invoice detection and the three documents). Sempre ligada = any unit gets the "Incluir SICAF" button (type or paste the CNPJ; adds only the Sicaf).
- [x] D5 – PDF copy (13/11/2026): the SICAF PDF goes into the SEI **and** is saved in Downloads with the SICAF's usual name (`consultarSituacaoFornecedor_<CNPJ>_<yyyy-mm-dd>.pdf`).

## 4. Decided rules

- **Pending invoices:** in the process tree, invoices and atestes that come **after the last "Folha de encaminhamento"** (or all of them, if there is none) still need documents. One set per **distinct supplier** (CNPJ).
- **Supplier already done:** a Sicaf with a file named with that supplier's name after the last Folha de encaminhamento → skip that supplier.
- **Per supplier:** Sicaf (with the PDF, tree name "Sicaf <supplier name>"), Consulta and Anexo (blank, plain names), same fields as the existing one-click creation (`specs/documentos-pagamento.md`).
- **Confirmation:** one window lists each supplier, CNPJ and the PDF obtained; nothing is written to the SEI before the user confirms (`CLAUDE.md`, Conventions).
- **Login:** if the SICAF sends to `acessoNegado.jsf`, the extension opens the Compras login page (`comprasnet.gov.br/seguro/loginPortalUASG.asp`), highlights "Entrar com gov.br" (Governo) and waits; after the login it goes to the SICAF by itself and continues.
- **Access to other sites:** asked only when the option is on (optional permission), so colleagues who do not use it are never asked.

## 5. What changes

- Sites: `sei.ifto.edu.br` (as today); new: `www3.comprasnet.gov.br/sicaf-web/*` and the Compras login page (`comprasnet.gov.br/seguro/*`, and the Compras desktop if needed to reach the SICAF).
- Data read: process tree, ateste text, invoice PDF (text), SICAF result and PDF. Written: SEI external documents (after confirmation); PDF in Downloads.
- Screens: extension bar notice and "Buscar" button (CGOC); "Incluir SICAF" button (any unit with Sempre ligada); confirmation window; CNPJ window when invoice and ateste differ; option in the settings; a small notice on the Compras login page.
- Likely code: `comum/sicaf.js` (CNPJ rules, tree rules, file name), `sites/sei/sicaf.js`, `sites/sicaf/*.js`, `sites/compras/login.js`, a background script to pass the PDF between tabs, a PDF text reader (pdf.js, loaded only when needed), `manifest.json` (optional host permissions, `downloads`). Reuse `comum/documentos-pagamento.js` and `comum/documento-externo.js`.

## 6. Stages

Each stage fits in a short conversation (`/etapa sicaf-automatico <n>`) and ends with tests, version and commit. Prerequisite: T36 (creating the three payment documents) passed.

- [ ] Stage 1 – **Find pending invoices** (v0.10.0): option "Incluir SICAF" in the settings; in the CGOC unit, read the tree (invoices, atestes, Folha de encaminhamento, existing Sicafs) and the ateste CNPJ; notice "N notas sem SICAF – Buscar" in the bar (button does nothing yet). **Before:** save (Ctrl+S on the tree frame) a process with invoices + atestes without a Folha de encaminhamento, and one with a Folha after them, in `ferramentas-de-teste/paginas-sei/`; tell which document types the invoice and the ateste have in the SEI.
- [ ] Stage 2 – **CNPJ from the invoice** (v0.11.0): read the invoice PDF text, compare with the ateste, window to pick or type when they differ or the invoice is a scanned image. **Before:** 2 or 3 invoice PDFs (NF-e, NFS-e, one scanned if any) in `ferramentas-de-teste/arquivos-sei/`.
- [ ] Stage 3 – **Get the PDF from the SICAF** (v0.12.0): permission request, open the SICAF tab, login page help, fill CNPJ, Pesquisar, get the PDF (and supplier name), save it in Downloads and return it to the SEI tab. **Before:** one SICAF PDF in `ferramentas-de-teste/pagina-compras/`; confirm the SICAF link from the Compras desktop (user menu › SICAF). Critical test (decides whether the SICAF accepts the automatic search).
- [ ] Stage 4 – **Add to the SEI** (v0.13.0): confirmation window; per supplier Sicaf with the PDF and tree name + Consulta + Anexo. Critical test (writes to the SEI).
- [ ] Stage 5 – **"Incluir SICAF" for any sector** (v0.14.0): with Sempre ligada, button in the bar of any unit: type or paste the CNPJ → SICAF → only the Sicaf with the PDF.

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
