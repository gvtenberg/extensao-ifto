# Instrumento de Cobrança (Contratos.gov.br)

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** draft, waiting for the pages and the user's description of the 6 tabs (the site was down on 23/11/2026)
- **Requested on:** 23/11/2026 · **Deadline or priority:** …
- **Planned version:** next middle number when stage 1 is coded

## 1. Goal (what for)

Third CGOC payment document: register one Instrumento de Cobrança (IC) per invoice in Contratos.gov.br (even for two invoices of one company), and attach its PDF to the blank "Anexo Instrumento de Cobrança NF nº …" the extension already creates in the SEI. Starts with contracts and "empenhos substitutivos de contrato" whose Contratos.gov.br ID is known.

## 2. Out of scope

- "Importar XML NFe" (later: needs the invoice XML, untested by the user).
- Invoices without a known contract ID.
- Reading the link from the main system (later, see D1). SIAFI appropriation (Finance does it).

## 3. Decisions to confirm

- [x] D1 – Where the link payment process → ID is saved? Answer (23/11/2026): in the extension now; later read from the main system through an API, possibly public without login (data already public in the Reitoria's Painel de Gestão). Never straight from the spreadsheet.
- [x] D2 – Who saves the IC? Answer: the extension, after the user confirms a summary with all values.
- [x] D3 – UASG? Answer: 158131 (Reitoria) for this contract; so saved per contract (others may be 158336).
- [x] D4 – Value different from earlier months? Answer: higher = red, two confirmations (D14; possible aditivo/apostilamento); lower = yellow (possible glosa).
- [x] D5 – Empenho substitutivo: its own ID, one per empenho.
- [x] D6 – More than one ID per process? Answer: yes; with more than one, the extension asks which for each invoice.
- [x] D7 – Several invoices: one at a time (summary, click, save, next).
- [x] D8 – Doubt (scanned invoice, missing field, value refused by the site; data that was read and differs follows D14): do not save; fill what is possible, highlight the doubt, leave the form open and the user clicks Salvar.
- [ ] D9 – Fields of the 6 tabs: source of each value, fixed values and what varies by contract. (User will describe when the site is back.)
- [ ] D10 – How to get the IC PDF (the user prints the "Ver" page today). Depends on `ver.html` and on what Firefox and Chrome allow.
- [ ] D11 – Value check: which earlier ICs count (how many months, which Situação) and any tolerance for small differences. Depends on `lista.html`.
- [ ] D12 – Invoice already registered. Answer (23/11/2026): the site itself refuses a repeated invoice (unique numbering); the extension may check too (extra check). Never registers again. Open: offer that IC's PDF for the SEI (suggestion) or only warn?
- [ ] D13 – UASG open on the site differs from the contract's: **to test**. User recalls every IC is made in the UASG that published the contract (today 158131); 3 contracts exclusive to Campus Palmas were registered in 158336 and published in 158131. Until tested: warn and stop (suggestion).
- [x] D14 – Different value or wrong CNPJ (23/11/2026): never goes on by itself; the divergence is shown very clearly (both values side by side); to go on, the user confirms **twice** (the warning appears two times). Applies to invoice × ateste, invoice × contract CNPJ and value higher than earlier months.
- [x] D15 – Same two confirmations in the SICAF/Simples search, for value or CNPJ (today one extra click). Update `regras/sicaf.md` when coded; the other red warnings there stay with one extra click.

## 4. Decided rules

- Example: ID 144270 = contract 11/2022, RG SEGURANÇA E VIGILÂNCIA LTDA, CNPJ 13.019.295/0002-70, process 23236.010039/2022-91. A continuing contract's payment process has invoices of that company and contract only.
- Addresses: list `https://contratos.sistema.gov.br/meus-contratos/<id>/instrumento-cobranca`; form `…/instrumento-cobranca/create` (may be opened directly).
- Saved per link: process, ID, number, company, CNPJ, UASG.
- Before filling: invoice × ateste × contract. Invoice × ateste exists (`regras/sicaf.md`, "Invoice × ateste check"); new: CNPJ × contract, value × earlier ICs, duplicates. Today's value check only looks for the ateste value anywhere in the invoice (may match the net value) and cannot check scanned invoices.
- Value: nearly the same every month; changes with aditivo/apostilamento; lower with a glosa.
- After saving the site returns to the list. Filtering Situação = Pendente shows ICs of every IFTO unit, plus old paid ones left pending by SIAFI sync errors: **identify by the invoice number** (and company, value, month), never by "Pendente" alone. Then "Ver" → PDF → SEI.
- Site down or slow (the 525 page seen on 23/11/2026): general rule "External systems can be down". After an uncertain save, never save again before looking for the invoice in the list.

## 5. What changes

- Sites: `contratos.sistema.gov.br` (new **optional** permission, off by default, explained in the settings) and the SEI process screen.
- Data read: invoice, ateste, list of ICs. Written: IC in Contratos.gov.br; PDF in the SEI Anexo.
- Screens: settings (links process → ID), SEI bar button, summary window, notices on the site.
- Samples (`ferramentas-de-teste/paginas-contratos-instrumento-cobranca/`, outside git): file 1 = list page **without rows** (columns and filters readable; rows come from `…/instrumento-cobranca/search`); file 2 = Cloudflare error page (only its `instrumento-cobranca.js` is useful). Still needed, copied with F12: `formulario.html` (6 tabs), `lista.html` (with rows), `ver.html`.

## 6. Stages

Provisional, to review after D9–D13:

- [ ] Stage 1 – Optional permission and process → ID links in the settings
- [ ] Stage 2 – SEI button and checks (contract, value, duplicate) with the double warning (D14), no writing; same double warning in the SICAF/Simples search (D15)
- [ ] Stage 3 – Fill the 6 tabs without saving (Crítico)
- [ ] Stage 4 – Summary, save and find the new IC (Crítico)
- [ ] Stage 5 – PDF into the SEI Anexo (Crítico)
- [ ] Stage 6 – README, rules, tests, end of the improvement

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
