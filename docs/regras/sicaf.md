# Automatic SICAF (invoices for payment)

**Sections**: Goal and limits · Settings and units · Pending invoices · Invoice × ateste check · SICAF search · Adding to the SEI · Selected CNPJ

Decided on 13/11/2026 (spec `specs/feitas/sicaf-automatico.md`, v0.10.0 to v0.15.0). Code map in `arquitetura.md`.

## Goal and limits

- For every invoice: find those still without SICAF, get the "Situação do Fornecedor" PDF from the SICAF and, after one confirmation, add Sicaf (with the PDF) and Consulta per supplier and one Anexo per invoice.
- The gov.br login (SerproID QR code, 6-digit code) is personal: **never automated**. The extension opens the Compras login page and clicks "Entrar com Gov.br" in the "Governo" card once per search (v0.17.3, user request); what happens on the Gov.br site is the user's.
- Filling Consulta and Anexo with PDFs (Simples Nacional / TCU, Contratos billing document) is a later idea (`melhorias-futuras.md`).

## Settings and units

- Option "SICAF da nota fiscal" (D4), same pattern as the signature list: **Automática** (default) = notice of invoices without SICAF only in the CGOC (CGOC/GAC/DAP/PAL/REI/IFTO); **Sempre ligada** = the selected-CNPJ button and the "Incluir SICAF" button (type or paste the CNPJ) in any unit with a process open; **Desligada** = nothing. With Automática, the selected-CNPJ button and menu also work only in the CGOC (decided 13/11/2026, v0.16.0; elsewhere the menu says to choose "Sempre ligada").
- In the CGOC the extension adds Sicaf, Consulta and Anexo; in other units only the Sicaf with the PDF.
- Access to Compras.gov.br (`www3.comprasnet.gov.br`, `comprasnet.gov.br`, `www.comprasnet.gov.br`, `cnetmobile.estaleiro.serpro.gov.br`) and to Downloads is an **optional permission**, asked once from the settings ("Permitir acesso ao Compras.gov.br"), so colleagues who do not use it are never asked.

## Pending invoices

- D10: by position in the tree: everything **after the last "Folha de Encaminhamento"** (or everything, if there is none) still needs documents.
- Tree names: invoice = external PDF "Nota fiscal nº <n> <supplier>"; ateste = SEI document starting with "Ateste"; one ateste may cover several invoices of the same supplier.
- Ateste lines read: "Empresa:", "CNPJ:", "Número da nota fiscal: 3.626 ( 3384844 )" (SEI number when given), "Nota de Empenho:" / "Número do empenho:", "Valor da nota fiscal:".
- Supplier already done: a Sicaf **with a file** after the last Folha whose PDF contains that CNPJ (names differ between invoice and SICAF, so the CNPJ decides). Invoice already done: an Anexo with a file after the last Folha with its number. Blank documents do not count.
- D2: notice "N notas sem SICAF – Buscar" in the extension bar; nothing opens before the click.

## Invoice × ateste check

- D1/D8: the **invoice PDF is the reference** (ateste and Folha are typed by hand). Supplier CNPJ = first formatted CNPJ with valid check digits that is not IFTO's (10.742.006/…); the issuer comes first, a carrier may come later.
- Checked: buyer is Campus Palmas **10.742.006/0003-50** (another 10.742.006/… = another IFTO unit); ateste × invoice: CNPJ, invoice number, value (R$), empenho (only when the invoice mentions one) and company name. Comparison ignores dots, leading zeros, accents and case; names accept abbreviations ("SERV." = "SERVIÇOS").
- D9: different CNPJ, number, value or empenho, another IFTO unit or no Campus Palmas CNPJ → **red**, needs a second click "Continuar mesmo assim"; company name difference → **yellow** notice only.
- Scanned invoice (no text) or different CNPJs: the user picks (invoice or ateste CNPJ) or types the CNPJ.

## SICAF search

- The extension opens the SICAF "Situação do Fornecedor" page in a new tab. If the SICAF refuses (acesso negado / sessão expirada), it opens the Compras login page once (and clicks "Entrar com Gov.br"); after the login, on the Área de Trabalho, it opens the user menu (`#avatar-dropdown-trigger`) and clicks "SICAF" (v0.17.3: going straight to the SICAF address right after the login gives "Sessão expirada"). If the SICAF still refuses, it goes to the Área de Trabalho at most twice more, then a notice says where to click. Any SICAF page that opens continues the search.
- The SEI window does not block the page (v0.17.3): the user can click the tree and see the note while it is open.
- For each CNPJ: Pessoa Jurídica, CNPJ, Pesquisar, "Situação do Fornecedor"; the PDF the SICAF sends is caught and checked (CNPJ inside the PDF must be the same; otherwise red).
- D5: the PDF goes into the SEI **and** is saved in Downloads as `consultarSituacaoFornecedor_<CNPJ>_<yyyy-mm-dd>.pdf`. Today's PDFs are kept in the browser (one per CNPJ): asking again on the same day does not open the SICAF.

## Adding to the SEI

- One confirmation window lists each supplier, CNPJ, the PDF obtained and the documents to create; nothing is written to the SEI before the click (`CLAUDE.md`, Conventions). Red warnings need a second click.
- Order: per supplier Sicaf (PDF, "Nome na Árvore" = SICAF company name without the final dot, D3) and Consulta (plain); per invoice one Anexo "Instrumento de Cobrança NF nº <number without leading zeros> <supplier as in the invoice tree name>" (D7). Example: CHC invoices 63 and 64 → Sicaf, Consulta, Anexo 63, Anexo 64.
- **Blank documents are reused** (decided 13/11/2026, v0.16.0): blank Sicaf, Consulta and Anexo after the last Folha that still have no tree name ("Sicaf (3385629)") are filled through "Alterar Documento Externo", in tree order: Sicaf gets the PDF and name, Anexo the name, Consulta stays as is. Only the missing ones are created.
- Same fields as the one-click payment documents (`specs/documentos-pagamento.md`): today's date, Nato-digital, Público. "Nome na Árvore" takes at most **50 letters**: cut at the last whole word (rule for every external document in `sei.md`).

## Selected CNPJ

- D6: selecting only a CNPJ (14 digits, with or without dots; check digits valid) on an SEI page shows a "Buscar SICAF" button next to it; in the browser PDF viewer (where extensions cannot act on the page) the right-click menu "Buscar SICAF deste CNPJ"; fallback: type or paste in the window. It acts right away on that CNPJ (no list), only where the option is on (see Settings and units): CGOC adds Sicaf, Consulta and the Anexos of that supplier's pending invoices; other units only the Sicaf.
