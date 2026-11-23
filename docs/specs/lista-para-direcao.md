# List of documents for the director to sign

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** stages 1 to 4 done (v0.35.0), README and rules written; stage 5 still needs the check with a document received in a block (saved page, section 5)
- **Requested on:** 23/11/2026 · **Deadline or priority:** the user decides
- **Version:** 0.35.0

## 1. Goal (what for)

The chief of staff of the Director-General's office sends the director, by WhatsApp, about 6 lists a day with 5 to 30 processes/documents, copied by hand. The extension builds the list in the SEI and copies it in the format the director's panel (`regras/lista-assinaturas.md`) already reads. It worked when no number is copied by hand.

## 2. Out of scope

- SEI signature blocks as the way to send (everyone is in the same unit); documents received in a block do enter the list.
- Sending without WhatsApp; monthly activity report (own spec, line in `melhorias-futuras.md`).

## 3. Decisions to confirm

All answered in the chat on 23/11/2026:

- [x] D1 – How to add: document icon menu (user's idea) + "Adicionar vários" + panel.
- [x] D2 – Already signed by the director: the item shows, with a warning before adding.
- [x] D3 – Documents only for "ciência": separate menu item.
- [x] D4 – Who: everyone in `PAL/REI/IFTO`, each with their own list; can be turned off.
- [x] D5 – Copied text: one line per process.
- [x] D6 – After copying: the list stays until "Já enviei, começar outra".
- [x] D7 – Sent lists: kept; automatic deletion off by default, with a term set by the person in the settings (the monthly report is due around the 10th of the next month).
- [x] D8 – Adding to the list assigns the process to whoever is signing, if turned on in the settings. Off by default.
- [x] D9 – Only the chief of staff assigns: the only targets are director and substitute; only the chief turns the option on.
- [x] D10 – Removing an item: offer to return the assignment.
- [x] D11 – Assignment failed: add the item anyway and warn.
- [x] D12 – Substitute: end date required, start date optional (blank = from today).
- [x] D13 – Recording director, substitute and chief: both ways, chosen from the SEI's assignment list or typed in the settings.
- [x] D14 – The chief of staff is recorded too; whoever replaces the chief on leave sets their own extension as the chief.
- [x] D15 – Process with someone who is not the chief nor the person signing: ask before assigning.

## 4. Decided rules

- **Where the item shows:** only in documents whose actions in the tree (`Nos[n].acoes`) include "Assinar Documento" (own unit's documents and those received in a signature block). The button may stay after signing and a signature may be another person's: never use "is signed" alone.
- **Signed by the director (D2):** read from the tree's `ASSINATURA` action ("Assinado por:" name, job title, unit), compared with the name of whoever is signing now. Signed only by other people: no warning.
- **Ciência (D3):** "Adicionar só para ciência" in documents without the sign button; writes "ciência" in the comment.
- **Several (D1):** "Adicionar vários deste processo" lists the process's signable documents with tick boxes, in tree order.
- **Repeated:** a document already in the open list is not added again; one in a sent list warns and asks.
- **Panel:** item count, comment, remove, order, "Copiar para o WhatsApp", "Já enviei, começar outra", sent lists (date, time, count, copy again). Shows "Assinando agora: <nome>" (and "até <data>" for the substitute).
- **Copied text (D5):** `processo - doc, doc, doc comentário`; different comments go on separate lines. Must be read by `comum/lista-assinaturas.js` (automated test: copied text read back gives the same items).
- **Storage:** only in the browser, in its own keys, never mixed with the director's `listaAssinaturas`. Deletion of old sent lists: switch off by default + term in days (D7).
- **Who is signing (D12):** settings keep matrícula and name of director and substitute, and the substitute's period. Outside the period the director is used; the end date counts as the last day.
- **Automatic assignment (D8, D9):** switch off by default; the settings text says it changes the assignment in the SEI at the click (the click is the confirmation, like "Assinar e próximo"; exception to the CLAUDE.md rule, user 23/11/2026). Already assigned to that person: nothing is sent. Several documents: one assignment per process.
- **Recording people (D13):** panel button "Escolher quem assina" (with a process open) shows the names of the SEI's assignment list; or type matrícula and name in the settings. Keep only the chosen people, never the whole list (contractors' login is their CPF).
- **Who may assign (D9, D14):** only when the logged-in matrícula (SEI top bar) is the recorded chief's. Anyone else: the option does nothing and the settings text says so.
- **Process with someone else (D15):** "O processo está com <nome>. Atribuir mesmo assim?". With the chief, unassigned or already with the person signing: no question. Answer no: item added, "não atribuído".
- **How the SEI assigns:** link `acao=procedimento_atribuicao_cadastrar` ("Atribuir Processo") in the process's tree actions, with `arvore=1`; read the page, form `frmAtividadeAtribuir`: `selAtribuicao` (value = SEI internal id, text "matrícula - nome", `null` = nobody, `selected` = who has it now), `hdnIdProtocolo`, button `sbmSalvar`. Find the person by the matrícula in the text (not the internal id); check `hdnIdProtocolo` is this process; after sending, read the page again and confirm who is selected before showing "atribuído". No link (process not open in the unit) or person not in the list: D11.
- **Undo (D10):** the previous person is kept with the item; removing the process's last item shows "Voltar a atribuição para <nome>" (or remove the assignment if it had none). Never by itself.
- **Failure or SEI down (D11):** time limit; item marked "não atribuído" in red, with "Tentar de novo"; copying warns about these items. The list works without assignment.

## 5. What changes

- **Sites and pages:** `sei.ifto.edu.br`: process tree (document icon menu, `#serialtip`; keep working with `menu-copiar.js`) and the panel on SEI pages.
- **Data:** reads the tree; stage 4 writes only the process assignment.
- **Screens:** menu items, panel, settings.
- **Code:** new `comum/lista-direcao.js` (pure rules) and `sites/sei/lista-direcao*.js`; reuse `comum/lista-assinaturas.js`, `comum/sei.js`, `sites/sei/sei-pedidos.js`.
- **Saved pages (`ferramentas-de-teste/paginas-sei/`):** `SEI - Atribuir Processo.html` received 23/11/2026 (opened from Controle de Processos; the process screen uses the same action with `arvore=1`, to be confirmed in the stage 4 critical test). Still needed for stage 5: a process with a document received in a block, before and after the director signs.

## 6. Stages

- [x] Stage 1 – Pure rules and Node tests: signable, signers, list, repeated items, copied text, who is signing on a date.
- [x] Stage 2 – Menu items (one, ciência, several) and storage.
- [x] Stage 3 – Panel (comment, remove, copy, "Já enviei", sent lists) and settings (on/off, director, substitute, period, deletion of old lists).
- [x] Stage 4 – Automatic assignment, undo and failures (critical test: writes to the SEI).
- [ ] Stage 5 – README and rules to `docs/regras/` (done, v0.35.0); check with block documents (pending).

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
