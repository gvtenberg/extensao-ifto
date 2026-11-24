# Empenho substitutivo de contrato (Contratos.gov.br)

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules (steps by hand) · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** draft, to continue after `instrumento-cobranca.md`; waiting for the pages
- **Requested on:** 24/11/2026 · **Deadline or priority:** after `instrumento-cobranca.md`
- **Planned version:** next middle number when stage 1 is coded

## 1. Goal (what for)

Materials invoices without a contract: before the Instrumento de Cobrança (IC), the nota de empenho (empenho = nota de empenho = NE) must be a "substitutivo de contrato", with its own ID and with Campus Palmas as participating unit. The extension finds which case the NE is in and helps until the "adicionar IC" page opens.

## 2. Out of scope

- Filling the IC (`instrumento-cobranca.md`). Issuing or topping up an empenho, and the Finance steps (ideas in `melhorias-futuras.md`).

## 3. Decisions to confirm

- [x] D1 – Own spec, after the IC for contracts with a known ID (24/11/2026); until then the in-extension help explains the steps by hand.
- [x] D2 – How far: the extension searches alone and says which case it is; every change on the site only after the user's confirmation.
- [ ] D3 – How to tell the Campus Palmas NE from the NEs with the same number of other units under the same UASG: which column or field? Depends on the pages.
- [ ] D4 – After finding or creating it, save NE + ID automatically as a link (`instrumento-cobranca.md`, D20)? Suggestion: yes, shown to the user.
- [ ] D5 – Remove-and-redo case: how many seconds to wait, and how to see that the site has registered it. Depends on the pages.
- [ ] D6 – Who may do each step (does the CGOC user have access to the orçamento module)? To ask.

## 4. Decided rules (steps by hand)

Told by the user on 24/11/2026:

1. **Already a substitutivo?** In the contratos module, search the NE in the long form (2026NE000123). Several IFTO units share the UASG, so several results may have that number: use the one of Campus Palmas.
   - **Found:** go to step 2.
   - **Not found:** look in the list of empenhos substitutivos. There: click the button that makes it a substitutivo; it gets an ID; add Campus Palmas as participating/decentralized unit (otherwise the Campus Palmas option does not appear).
   - **Not in that list either:** in the orçamento module, search the NE (again several units) and click the option that makes it a substitutivo. Then back to the list.
2. **Campus Palmas** must be a participating/decentralized unit of that empenho-type contract.
3. Open the "adicionar instrumento de cobrança" link of that contract.

- **Why it happens:** when issuing the empenho (orçamento module) there is an option saying the NE replaces a contract, but most people forget it.
- **Stuck case:** the site already treats the NE as a substitutivo, but it is neither in the contracts nor in the list to add. Remove the substitutivo mark, wait some seconds for the site to register it, mark it again; then contratos module → choose the NE in the list → click the button → add Campus Palmas → add the IC.
- **Afterwards:** the process goes to Finance, which uses the financeiro module of Contratos.gov.br to enter invoice and empenho data in the appropriation and send it to SIAFI.

## 5. What changes

- Sites: `contratos.sistema.gov.br` (contratos and orçamento modules), same optional permission as the IC.
- **Pages to ask the user for** (F12 copy; the user asked to be reminded): (1) contratos module, search by NE with results; (2) list of empenhos substitutivos; (3) contract: participating/decentralized units; (4) orçamento module, NE search with the substitutivo option (mark and remove); (5) the stuck case, when it happens.

## 6. Stages

To define after the pages. Likely: search and diagnosis (no writing) → mark and add Campus Palmas (Crítico) → remove and redo (Crítico).

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
