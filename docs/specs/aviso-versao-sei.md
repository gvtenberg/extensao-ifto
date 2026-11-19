# SEI version warning

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** ready to code (after the base-e-sei and conferir-documento agents of 18/11/2026 are merged: same settings page)
- **Requested on:** 18/11/2026 · **Deadline or priority:** next
- **Planned version:** 0.28.0 (base-e-sei stages 2, 3, 5 take 0.27.x)

## 1. Goal (what for)

When the IFTO SEI changes to a version the extension was not tested on, the person is told on the SEI itself that some functions may not work, and chooses to continue or to turn the extension off on the SEI. Today the warning exists only inside the icon window (`janela/index.js`, `seiTestado` in `comum/sei.js`) and offers no choice.

## 2. Out of scope

- Turning off single functions (decided: all or nothing).
- Testing the new SEI automatically.

## 3. Decisions to confirm

- [x] D1 – Where: a box on the SEI page as soon as it opens with the untested version, buttons "Continuar usando" and "Desativar a extensão no SEI"; the icon window keeps showing the warning (user, 18/11/2026).
- [x] D2 – What turns off: **all** extension functions on the SEI (signature list, SICAF/Simples, checks, editor buttons, password fix…); the version warning keeps working. Back on with "Ativar de novo" in the icon window and in the settings (user, 18/11/2026).
- [x] D3 – Ask again: the choice is remembered **per SEI version**; asks again only on another SEI version. A new extension version that marks that SEI as tested removes the warning by itself (user, 18/11/2026).

## 4. Decided rules

- Untested = the first three numbers of the SEI version (`5.0.4` in `?5.0.4-2.45.1`) differ from `VERSAO_SEI_TESTADA`.
- The choice is stored in the browser (`storage.local`), with the SEI version it was made for.
- Turned off: no extension function acts on the SEI; only the warning box (and "Ativar de novo") remain. The person can always change their mind.

## 5. What changes

- Pages: every SEI page (`sites/sei/todas-as-paginas.js` shows the box).
- Data: nothing written to the SEI; only the choice in the browser.
- Screens: box on the SEI (`docs/padrao-visual.md`), icon window (buttons), settings ("Geral": switch/state "Extensão ligada no SEI").
- Code: every SEI content script must check the "off" state before acting (one shared check in `comum/`, with Node tests for the rule "ask / on / off for this version"). Knock-on: scripts start before the async storage read, so each one waits for the check; features opened from the SEI on other sites (SICAF, Compras) stay off too, since they start from the SEI.

## 6. Stages

- [ ] Stage 1 – Shared rule + box on the SEI + icon window + settings + all SEI scripts obey the "off" state. Test: change `VERSAO_SEI_TESTADA` in a temporary copy (development computer) and see the box; choose each button.

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
