# Ideas

**Sections**: Ideas · Suggested order (to confirm with the user) · Other sites (fill in and capture data) · Distribution

One line each. Status of what is done or pending: `melhorias-futuras.md`.

## Ideas

One line per idea. When an idea is planned, it gets a spec in `docs/specs/` and the line points to it. When finished, the line leaves here and goes to `docs/historico.md`.

- **Copy bidding documents to Compras.gov** (26/11/2026, user: "em breve"): the extension copies some documents (e.g. Termo de Referência, after "Remover Formatação da AGU") to Compras.gov automatically.

- **Check "Interessado" and "Assunto"** (18/11/2026): like the process number, warn when they do not match the process (after `specs/feitas/conferir-documento.md`).
- **Settings page smaller and clearer** (18/11/2026): today it is long with little information spread out; first round was stage 1 of `specs/feitas/conferir-documento.md`; later rounds as needed.
- **Differences inside the document** (19/11/2026, T195): auto-save "Ver diferenças" shown in the text itself (green and struck-through red), instead of the side panel.
- **Own shortcuts in the SEI button bar** (19/11/2026): each user adds buttons for any SEI page they use often (generalizes the v0.34.0 "Blocos Internos" button; links must come from the menu, since the SEI checks a security hash).
- **Process templates** (19/11/2026): each user saves "model processes" (process type, fields filled in and the list of documents to add); one click, maybe a button on the SEI home page like "Blocos Internos", opens the new process already filled and adds all its documents. For units that open the same kind of process with the same documents several times a month. Related: "Process types and checklists" and the "New document" button in `specs/base-e-sei.md`. Questions for `/planejar` (undecided): templates per person or shared by the whole unit? documents added empty or with saved text? confirm before creating the process in the SEI?
- **Campus Palmas panel on the process screen** (19/11/2026): in the empty area of the process screen (maybe also the SEI home page), campus information: links to IFTO systems, campus documents (internal rules, normative ordinances, opinions), news banner, open calls (grants, internships, tutoring), planning calendar, training, events. Content managed by the Coordenação de Comunicação e Eventos in its own panel (an edit-restricted Google spreadsheet, or a form page in the main system), each item with area, start and end date (shows and hides by itself, no new version). Each user ticks interest areas (ensino, pesquisa, extensão, bolsas, estágios, orçamento, eventos, capacitações…) in the settings, kept only in the browser; panel shows those plus "for everyone". Decided (19/11/2026): works **without login**, read from a Google spreadsheet "published on the web" as CSV (public content only; Google refreshes it in ~5 min). Suggested: panel off by default, optional permission for `docs.google.com` (and Drive for banner images) asked when the user turns it on. To plan: confirm that, home page too?, form page or sheet for the Communication office. Also show (19/11/2026): restaurant menu of the day, academic calendar, main sectors' phone and e-mail (same public sheet). Plus: urgent notice at the top for everyone (power/water cut, class suspension), and "add to Google Calendar" button on events.

- **Suggest SEI Favoritos** (19/11/2026, user): the extension sees which document types the user creates most (e.g. via Pesquisa, last months) and suggests saving a model in the SEI's own Favoritos (`referencias/menu-sei.md`). LGPD: only the user's own documents, read in the browser, nothing sent, off by default with a plain explanation. Despacho is used in every kind of process: group it by process type (e.g. "Despacho in Pagamento") and let the user pick the one to save, instead of reading every text; comparing texts is a later option. Decide in `/planejar`.
- **Monthly SEI report** (23/11/2026: most technical staff need it by about the 10th of the next month, with more detail than the SEI reports; may reuse the menu and sent lists of `specs/lista-para-direcao.md`) (19/11/2026, user): the extension finds in the SEI what the user did in the month (documents created and signed, processes handled, sectors) and builds a plain-text summary for the Programa de Gestão and for divulgation; stays in the user's browser, nothing sent without seeing it. **Do not save the documents on the computer** (user): the extension helps fill the SEI search (Pesquisa: Usuário gerador = the user's registration, filled when the field is clicked, or another user by name/registration; "Assinatura / Autenticação" for documents created by others and signed by the user; Data entre = last month) and the "Relatório de Atividade na Unidade" menu (Unidade, Usuário, Período, Tipo); then opens each process/document found to build the report, or saves them all as PDF for an AI to analyse. Saved pages: `ferramentas-de-teste/paginas-sei/SEI - Pesquisa.html` and `SEI - Relatório de Atividade na Unidade.html` (development computer). Other SEI menu pages to consider (pages not saved yet; ask the user): Estatísticas > Unidade and Desempenho de Processos, Painel de Controle, Pontos de Controle, Controle de Prazos, Acompanhamento Especial. Suggest the approach in `/planejar`.
- **Send a highlight to Communication** (19/11/2026): from the monthly report, the user sends one item (short text + link) to the Communication office's sheet, which chooses what goes to the campus panel and its channels (sending needs the user's confirmation).
- **Who's who in the SEI** (19/11/2026): hovering a unit acronym (e.g. CGOC/GAC/DAP/PAL) shows full name, head, phone extension, e-mail, block and room, from a public sheet kept by the campus.
- **"Which sector does this?" guide** (19/11/2026): search a task ("solicitar diária", "pedir compra") and get the sector, the process type to open and the documents needed; pairs with the process templates.
- **Note when sending a process** (19/11/2026): short standard message ("o que precisa ser feito / prazo") so the receiving sector understands without phoning.
- **Follow processes** (19/11/2026): mark processes to watch; warn when they come back to the unit, get a new document or stay stopped too long.
- **Deadline warnings** (19/11/2026): expiring contracts and commitments, from the system spreadsheet (with login, budget team).

- **First steps in the SEI** (19/11/2026): short tips the first time a person opens each SEI screen (new staff, interns, contractors); can be turned off.
- **Unit away notice** (19/11/2026): a unit marks "Fulano de férias até…, procure…" in the public sheet; shown when sending a process to that unit.
- **Shared sector shortcuts** (19/11/2026): the sector's most used processes and documents, from a sheet the sector keeps, shown to everyone in it.
- **Ready-made texts by situation** (19/11/2026): standard paragraphs for despacho, ofício, memorando inserted with one click in the SEI editor, following IFTO writing standards.
- **Plain-language check** (19/11/2026): before signing, points out very long sentences, unexplained acronyms and repeated words (no paid services).
- **Sector numbers for the month** (19/11/2026): processes in and out, time they stayed, the oldest ones; read from the SEI, shown only to the user.
- **Waiting for my signature** (19/11/2026): reminder in the icon window for documents waiting for the user's signature for days.

- **Campus TVs** (19/11/2026, user; separate web page, not the extension): TVs in busy places show the campus panel content (actions, open calls, grants, events, urgent notices) from the same public sheet. Each TV opens a full-screen page with its location (e.g. `?local=refeitorio`); each item has audiences (professores, ensino médio, ensino superior, servidores, público externo) and each location its own (sala dos professores, refeitório, biblioteca, blocks of ensino médio = minors, only items marked for them). Free hosting (Google, like the main system). Later: "Hoje neste bloco" from the room booking, timetable, calendar and room allocation systems, if they export data (which systems: to ask). Campus still deciding.

- **Gmail drafts for companies and sectors** (19/11/2026): one click opens a Gmail draft (link only, no login or permission; the user checks and sends): standard e-mails to suppliers (send documents, SICAF certificate expired, empenho issued; address from the SICAF data), sector e-mail templates kept in a sheet, and the monthly SEI report to the boss or Communication. Off by default; choose the right Google account.
- **Google Calendar from the SEI** (19/11/2026): one click opens a new Calendar event (link only; the user saves): process deadlines (Controle de Prazos), end of contracts and commitments, call deadlines, with reminders; and "meeting about this process" with the link and the people of the involved units.

Marks: **[spec]** already has a spec.

### Suggested order (to confirm with the user)

1. Extension base and SEI improvements (replacing SEI++, which stopped working on the IFTO SEI): New document button, pre-filled external document, drag files with the type recognized **[spec]** → `specs/base-e-sei.md`
   - Process types and checklists (stage 4 taken out of `specs/base-e-sei.md` on 18/11/2026): waits for D8 there (does a new invoice restart the checklist?).
   - Default external document type per process (18/11/2026, user): a settings rule with the process number and its default type (e.g. the ~5 contract-oversight processes with dedicated labour, where almost every external document is "Demonstrativo"). Fits with D14 of `specs/base-e-sei.md`; to plan.
   - Add files directly to a SEI 5 process (12/11/2026): already stage 3 of the spec ("Arrastar arquivos"). An IFTO colleague managed this in their own extension on SEI 5: ask for the extension's name or address and note it in `referencias/` before stage 3.
   - Later: **automatic PDF compression** inside the extension (26/10/2026): compress, compare sizes, report how much is saved on the Rectorate file server, and show the original and compressed PDF side by side so the user sees the quality difference and picks one. Mandatory above 10 MB. Preferably without sending the file to outside sites (D13 of the spec).
   - **Payment documents (CGOC)**: done (T36 passed 19/11/2026; spec in `specs/feitas/documentos-pagamento.md`, rules in `regras/sei.md`). Ideas left:
     - Later, after the automatic SICAF (13/11/2026): **branch without its own SICAF** (about 1 invoice in 50 a month): when the SICAF finds nothing for a branch CNPJ (ending other than 0001-xx), offer to search the head office CNPJ (same first 8 digits + 0001 + recalculated check digits; e.g. 14.159.957/0006-02 → 14.159.957/0001-90).
     - Later, after the automatic SICAF (13/11/2026): **invoice type checks** — materials invoice: ateste must be "Ateste Fatura Materiais" and the Folha must have the "Comprovante SUAP" column; services invoice: ateste must be "Ateste Fatura Serviços" and the Folha has no "Comprovante SUAP" column. Warn when they do not match.
     - Later (13/11/2026): **forwarding deadline warning** — materials invoices: forward by about day 25 of the month (IFTO and federal systems must record the asset/stock entry in the same month); services invoices: by about day 22 (Finance needs time to pay the taxes on time). Warn when forwarding after the date ("most" invoices: the user decides; exact days to confirm).
     - Later (13/11/2026): **RANFS for services from another municipality** — a services invoice from a city other than Palmas almost always needs a RANFS, whose data must match the invoice exactly; check that it exists and compare. Waiting for a RANFS sample from the user.
     - Later, after the automatic SICAF (13/11/2026): **the extension makes and fills the Folha de Encaminhamento** (CGOC) from the invoices, atestes, Sicaf, Consulta and empenhos in the tree, to avoid typing errors. Table per company: invoice number, invoice SEI number, period, ateste, SICAF, Simples Nacional, empenho and its SEI number. Samples: `ferramentas-de-teste/paginas-sei/SEI-folha-encaminhamento-1.html` (materials) and `-2.html` (services).
     - Later: **own settings for the bidding team** (13/11/2026, user): today they use "Sempre ligada" (only "Incluir SICAF").
     - Later: attach the other PDFs automatically: TCU consolidated lookup (instead of the Simples in some processes; ask the user when).
     - **[spec]** Instrumento de Cobrança (Contratos.gov.br) registered and attached: `specs/instrumento-cobranca.md`. Left for later: "Importar XML NFe" (button on the site's list page; needs the invoice XML, so more steps; not tested by the user yet); contract IDs read from the main system through an API.
     - **[spec]** Empenho substitutivo de contrato (find or create, add Campus Palmas): `specs/empenho-substitutivo.md`, after the Instrumento de Cobrança.
     - Later (24/11/2026, user): **issue an empenho** (laborious today) and **top up an empenho** (simpler): first the credit breakdown (detalhamento de crédito) in SIAFI, then issue/top up in Contratos.gov.br; help with all of it. When issuing, remind the person to tick the "substitutivo de contrato" option.
     - Later (24/11/2026, user): **Finance**: help the financeiro module of Contratos.gov.br (invoice and empenho data in the appropriation, sent to SIAFI). Details to learn from Finance, who will also use the extension.
     - Later (24/11/2026, user): **links to the main systems** (SIAFI, Contratos.gov, SCDP…; several departments use them): each person chooses in the settings which links to see (and may add others) and where: extension bar in the SEI or icon window.
     - Later (23/11/2026, user): **late invoice warning** for continuing contracts. Most are billed monthly, each around its own day; sometimes the inspector is on vacation, the substitute is not told and nobody certifies the invoice. Warn the CGOC when a contract's invoice/bill of the month has not arrived or been certified by the expected date. To plan: expected day per contract (typed, or learned from earlier ICs), where the extension looks and where the warning appears.
     - Later: show the three-document button only for some process types (the user will say which).
     - Later (12/11/2026): in the CGOC settings, choose which document types the button creates (today Sicaf, Consulta, Anexo; maybe only two in the future).
   - **Search institutional documents** (17/11/2026, user): a search box in the extension (icon window) for manuals, normative ordinances and instructions, ODP, PDI and any institutional document published in the SEI (preferred) or on the IFTO site; search by the document name or words inside it; show the SEI link (or IFTO link). Suggestions to discuss when planning: (a) a curated list kept in a new tab of the system spreadsheet (title, type, number/year, keywords, SEI link, IFTO link, in force or revoked), fast and free, maintained by CGOC; (b) for words inside the text, open the SEI's own search (logged in) already filled, instead of the extension indexing PDFs; (c) search ignoring accents and capitals, with synonyms of acronyms (ODP, PDI, IN, PN); (d) show type, number, date and a "revoked" warning; favorites; (e) prefer links that open for any IFTO colleague (public/external access link), IFTO site as fallback.
   - **Standard profiles per SEI unit** (12/11/2026): Director-General, Contracts, Procurement etc., each with its own features on by default, recognized by the unit open in the SEI (`#lnkInfraUnidade`). The first profile feature is the signature list (Director-General).
2. Google login and reading the system spreadsheet (without login, only the SEI improvements).
3. Commitment note request in the SEI: fill the document with the text the system already builds (system v0.43.0; rules in `../sistema-orcamento-ifto/docs/regras/solicitacao-empenho.md`). Depends on the system's test T40 ("Colar no SEI").
4. Recording invoices paid per demand (feeds "liquidado" per demand and, later, the system's financial module). Decided on 19/10/2026: right after the commitment note request, after manual tests. Requires writing to the spreadsheet.

### Other sites (fill in and capture data)

- Contracts (Comprasnet Contratos).
- Purchases part 3 of the system: read the price-registration balances from Comprasnet pages (one option; the others are TG and some public Comprasnet service).
- SUAP.
- SIAFI.
- SICAF.
- Simples Nacional.

### Distribution

- Chrome version: free package without the store, done in v0.5.0 (`publicacao.md`, "Chrome version"). **[spec]** Chrome Web Store, unlisted, personal account (US$5 once; user, 18/11/2026): draft with step by step and privacy page in `specs/chrome-web-store.md`, to be planned better.
- **"What's new" between published versions** (19/11/2026, user): for each version published on GitHub (Releases), a list of the features added or removed compared with the previous published version (not commit by commit), in plain Portuguese for users, e.g. "adicionada opção para remover MINUTA de edital".
- When the extension leaves development: decide whether the "Procurar atualização" button leaves the icon window (12/11/2026).
- Mozilla "unlisted" signing via GitHub, with automatic updates: prepared in v0.1.1 and v0.1.2 (`publicacao.md`); the user still has to create the keys. Later, maybe, for campus colleagues. Colleagues currently use SEI Pro.
- **To plan (tests round 26/11/2026, user; run `/planejar` for each):**
  - Settings pages clearer, with folded explanations, and a new title for "Lista para a direção" on every page (T243).
  - Yellow warnings: new colour palette (T258).
  - Notices that close by themselves: a bar on top that starts full and shrinks until the notice closes; pauses with the mouse over it; "×" closes now; only for success notices (errors and questions stay) (T259, T267).
  - Simpler GitHub test cards: only version, commit and where (T262).
  - Screen in the settings to see and edit the unit data the extension saved (timbre, footer, signature) (T267).
  - #355: tooltip with the full name of a tree document (SEI and external); "R$ por extenso" keeps the bold of the value; "Duplicar documento" for external documents (without the attached file); new blank lines keep the formatting of the line above; style list opens scrolled to and showing the current style; signature data per unit in the settings.
- Fatura and Nota fiscal: also add the "Folha de Encaminhamento" (and a real Instrumento de Cobrança, see `specs/instrumento-cobranca.md`), not only the blank Anexo (26/11/2026, user: later).
- SEI background colour option (26/11/2026, user).
- Make the project follow the LGPD (Brazil's data protection law) (#355, 26/11/2026).

