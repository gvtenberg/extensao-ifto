# Automatic SICAF (invoices for payment)

**Sections**: Goal and limits · Settings and units · Pending invoices · Invoice × ateste check · SICAF search · Adding to the SEI · Selected CNPJ

Decided on 13/11/2026 (spec `specs/feitas/sicaf-automatico.md`, v0.10.0 to v0.15.0). Code map in `arquitetura.md`.

## Goal and limits

- For every invoice: find those still without SICAF or Simples Nacional, get the "Situação do Fornecedor" PDF from the SICAF and the Simples Nacional lookup PDF (site and PDF rules in `specs/feitas/consulta-simples.md`, section 4) and, after one confirmation, add Sicaf and Consulta (each with its PDF) per supplier and one blank Anexo per invoice. **One button for everything** (v0.18.0, user 13/11/2026): the old "Incluir Sicaf, Consulta e Anexo" (blank documents) button and its setting were removed.
- The gov.br login (SerproID QR code, 6-digit code) is personal: **never automated**. The extension opens the Compras login page and clicks "Entrar com Gov.br" in the "Governo" card once per search (v0.17.3, user request); what happens on the Gov.br site is the user's.
- Filling the Anexo (Contratos billing document) and the TCU lookup are later ideas (`melhorias-futuras.md`).

## Settings and units

- Option "SICAF e Simples Nacional" (D4): **Automática** (default) = the invoice button only in the CGOC (CGOC/GAC/DAP/PAL/REI/IFTO); **Sempre ligada** (bidding team, until it has its own settings; v0.18.0) = only the "Incluir SICAF" bar button (type or paste the CNPJ, no invoice needed) in any unit with a process open, which adds **only the Sicaf** (also in the CGOC; no invoice notice); **Desligada** = nothing. With Automática, the selected-CNPJ buttons and menu also work only in the CGOC (v0.16.0; elsewhere the menu says to choose "Sempre ligada").
- Selected CNPJ (v0.18.0): in the CGOC one button "Incluir SICAF, Simples e Anexo" (Sicaf, Consulta and the Anexos of that supplier's pending invoices); in other units two buttons, "Incluir SICAF" and "Incluir Simples Nacional" (only that document). Right-click menu: everything in the CGOC, only the Sicaf elsewhere.
- Access to Compras.gov.br (`www3.comprasnet.gov.br`, `comprasnet.gov.br`, `www.comprasnet.gov.br`, `cnetmobile.estaleiro.serpro.gov.br`) and to Downloads is an **optional permission**, asked once from the settings ("Permitir acesso ao Compras.gov.br"), so colleagues who do not use it are never asked.

## Pending invoices

- D10: by position in the tree: everything **after the last "Folha de Encaminhamento"** (or everything, if there is none) still needs documents.
- Tree names: invoice = external PDF "Nota fiscal nº <n> <supplier>"; ateste = SEI document starting with "Ateste"; one ateste may cover several invoices of the same supplier.
- Ateste lines read: "Empresa:", "CNPJ:", "Número da nota fiscal: 3.626 ( 3384844 )" (SEI number when given), "Nota de Empenho:" / "Número do empenho:", "Valor da nota fiscal:".
- Supplier already done: a Sicaf **with a file** after the last Folha whose PDF contains that CNPJ (names differ between invoice and SICAF, so the CNPJ decides), and a Consulta **with a file** whose PDF has a CNPJ with the same first 8 digits (the Simples covers the whole company, head office and branches; v0.18.0). An invoice is pending while its supplier lacks either; each search only asks for what is missing. Invoice Anexo done: an Anexo with a file after the last Folha with its number. Blank documents do not count.
- D2: button "N notas sem SICAF ou Simples – Buscar" in the extension bar; nothing opens before the click. No pending invoice: no button.

## Invoice × ateste check

- D1/D8: the **invoice PDF is the reference** (ateste and Folha are typed by hand). Supplier CNPJ = first formatted CNPJ with valid check digits that is not IFTO's (10.742.006/…); the issuer comes first, a carrier may come later.
- Checked: buyer is Campus Palmas **10.742.006/0003-50** (another 10.742.006/… = another IFTO unit); ateste × invoice: CNPJ, invoice number, value (R$), empenho (only when the invoice mentions one) and company name. Comparison ignores dots, leading zeros, accents and case; names accept abbreviations ("SERV." = "SERVIÇOS").
- D9: different CNPJ, number, value or empenho, another IFTO unit or no Campus Palmas CNPJ → **red**, needs a second click "Continuar mesmo assim"; company name difference → **yellow** notice only.
- Scanned invoice (no text) or different CNPJs: the user picks (invoice or ateste CNPJ) or types the CNPJ.

## SICAF search

- The extension opens the SICAF "Situação do Fornecedor" page in a new tab. If the SICAF refuses (acesso negado / sessão expirada), it opens the Compras login page once (and clicks "Entrar com Gov.br"); after the login, on the Área de Trabalho, it opens the user menu (`#avatar-dropdown-trigger`) and clicks "SICAF" (v0.17.3: going straight to the SICAF address right after the login gives "Sessão expirada"). If the SICAF still refuses, it goes to the Área de Trabalho at most twice more, then a notice says where to click. Any SICAF page that opens continues the search.
- The SEI window does not block the page (v0.17.3): the user can click the tree and see the note while it is open.
- For each CNPJ: Pessoa Jurídica, CNPJ, Pesquisar, "Situação do Fornecedor"; the PDF the SICAF sends is caught and checked (CNPJ inside the PDF must be the same; otherwise red).
- D5 (changed 13/11/2026, v0.18.2, user): every click fetches the SICAF and Simples PDFs again from the sites; **nothing is kept by the extension** (PDFs live only inside the running search and are erased at the end; old day memory `sicafPdfs`/`simplesPdfs` is deleted on start). The PDF goes into the SEI; a copy in Downloads (`consultarSituacaoFornecedor_<CNPJ>_<yyyy-mm-dd>.pdf`) only with the setting on: "copiaSicaf" and "copiaConsulta" (both on by default). The supplier name shown comes from the SICAF PDF (razão social).

## Adding to the SEI

- One confirmation window lists each supplier, CNPJ, the PDF obtained and the documents to create; nothing is written to the SEI before the click (`CLAUDE.md`, Conventions). Red warnings need a second click.
- Order: per supplier Sicaf (PDF, "Nome na Árvore" = SICAF company name without the final dot, D3) and Consulta (Simples PDF, "Consulta Simples Nacional <Nome Empresarial>"; not created when the lookup failed, so the invoice stays pending); per invoice one blank Anexo "Instrumento de Cobrança NF nº <number without leading zeros> <supplier as in the invoice tree name>" (D7). Example: CHC invoices 63 and 64 → Sicaf, Consulta, Anexo 63, Anexo 64.
- **Blank documents are reused** (decided 13/11/2026, v0.16.0): blank Sicaf, Consulta and Anexo after the last Folha that still have no tree name ("Sicaf (3385629)") are filled through "Alterar Documento Externo", in tree order: Sicaf and Consulta get the PDF and name, Anexo the name. Only the missing ones are created.
- Same fields as the old one-click payment documents (`specs/documentos-pagamento.md`): today's date, Nato-digital, Público. "Nome na Árvore" takes at most **50 letters**: cut at the last whole word (rule for every external document in `sei.md`).

## Selected CNPJ

- D6: selecting only a CNPJ (14 digits, with or without dots; check digits valid) on an SEI page shows buttons next to it (v0.18.0: see Settings and units); in the browser PDF viewer (where extensions cannot act on the page) the right-click menu "Buscar SICAF deste CNPJ"; fallback: type or paste in the window. It acts right away on that CNPJ (no list), only where the option is on (see Settings and units): CGOC adds Sicaf, Consulta and the Anexos of that supplier's pending invoices; other units only the Sicaf or only the Consulta (button chosen).
