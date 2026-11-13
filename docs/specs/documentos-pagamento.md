# Payment documents in the SEI (Sicaf, Consulta, Anexo)

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** in progress
- **Requested on:** 12/11/2026 · **Priority:** high (about 50 payment processes a month, most at the start of the month)
- **Planned version:** 0.6.0 to 0.8.0

## 1. Goal (what for)

CGOC adds three blank external documents (Sicaf, Consulta, Anexo) to every payment process, each by hand (Incluir Documento › Externo › type, today's date, Nato-digital, Público). The extension does it with one click and, on every new external document page, fills today's date, Nato-digital and Público.

## 2. Out of scope

- Attaching the PDFs (SICAF, Simples Nacional or TCU consolidated lookup, Contratos billing document from the invoice and commitment data): next improvement (line in `melhorias-futuras.md`).
- Showing the button only for some process types: later (line in `melhorias-futuras.md`).
- Choosing in the settings which document types the CGOC button creates (today three; maybe two later): later (line in `melhorias-futuras.md`).
- The other fields of stage 2 of `base-e-sei.md` (document type, legal basis, file name, size tips): stay there.

## 3. Decisions to confirm

Claude does not code while there is a `[ ]` that affects the stage.

- [x] D1 – How automatic? Answer (12/11/2026): **one click + confirmation**, then the extension opens Incluir Documento › Externo, fills and clicks Salvar three times by itself. The click on the confirmation is the approval (same exception as "Assinar e próximo").
- [x] D2 – Where is the button? Answer: in the **extension bar** (floating, top right, after the process buttons), the same place for every unit; it appears only with a process open. Setting with **Automática / Sempre ligada / Desligada**, like the signature list; "Automática" = unit `CGOC/GAC/DAP/PAL/REI/IFTO`.
- [x] D3 – Número and Nome na Árvore: **left blank**.
- [x] D4 – The old "Novo documento" button: **removed completely** (SEI 5 always shows Incluir Documento).
- [x] D5 – Existing documents: the extension **checks first** and warns once if (a) it already created the three in this process today, or (b) the tree has a Sicaf, Consulta or Anexo **without a file**. Old documents with a PDF do not warn. The SEI's own question ("Já existe um documento…") stays as a last check.
- [x] D6 – Prefill on new external document pages: setting **on by default**, with a small note "Preenchido pela extensão: confira".
- [x] D7 – Both features on: **side by side in one bar**.

## 4. Decided rules

- **New vs. existing external document:** new = page `acao=documento_receber`; existing (with or without file) = `acao=documento_alterar_recebido`, never changed.
- **Prefill (new only):** Data do Documento = today (dd/mm/yyyy), Formato = Nato-digital, Nível de Acesso = Público; only fields still empty or unmarked. Never clicks Salvar on this page by itself (only during the three-document creation).
- **Three documents:** order Sicaf, Consulta, Anexo; types matched by the name in the "Tipo do Documento" list; same fields as the prefill; nothing else filled.
- **Extension bar:** one floating bar at the top right of full SEI pages; each feature turned on adds its button; not draggable (the signature list panel still is, and opens below the bar). Shown only when the open unit has a feature with a button on that page (other units: no bar).
- **Settings page (12/11/2026, user):** general settings first (prefill, password), then one section per unit (Direção-geral: signature list; CGOC: payment documents).
- **Stopping:** if the SEI asks a question and the user cancels, or a page does not open in time, the extension stops and says which documents were created.

## 5. What changes

- **Pages:** SEI process page (bar and button), `documento_escolher_tipo` (clicks "Externo"), `documento_receber` (prefill and, during the creation, Salvar), process tree (check for blank documents).
- **Data written:** the SEI (three external documents, after confirmation). Browser: settings and "created today" record per process.
- **Screens:** settings page (two new options, one removed), extension bar on SEI pages.
- **Likely code:** `comum/documento-externo.js` (rules with tests), `sites/sei/documento-externo.js`, `sites/sei/barra-extensao.js`, `sites/sei/documentos-pagamento.js`, `sites/sei/lista-assinaturas.js`, `configuracoes/`, `manifest.json`.

## 6. Stages

- [x] Stage 1 – **Prefill and old button removed** (done in v0.6.0, 12/11/2026; tests T28 and T29). Remove "Novo documento"; fill date, Nato-digital and Público on new external document pages, with the setting and the note. Test: Incluir Documento › Externo shows the fields filled; an existing document's page is not changed.
- [x] Stage 2 – **Extension bar and CGOC button** (done in v0.7.0, 12/11/2026; the button only shows a "next version" message until stage 3; tests T30 to T32). Shared bar at the top right; signature list button moves into it; "Incluir Sicaf, Consulta e Anexo" button (only with a process open) with the Automática / Sempre / Desligada setting. Test: CGOC unit sees the button in a process, not on the home page; Direção-geral keeps the list button.
- [ ] Stage 3 – **Creating the three documents** (v0.8.0). Confirmation, check for existing blank documents (D5), Incluir Documento › Externo › fill › Salvar three times, final message. **Before:** saved on 12/11/2026: `SEI - Controle de Processos.html` (CGOC, the SEI calls the home page "Controle de Processos") and `SEI - 23236.012523_2026-88.html` (open process; its `_files` folder with the tree frame still needed) in `ferramentas-de-teste/paginas-sei/` (12/11/2026; best with a Sicaf without a file in the tree); save a process tree page that has a Sicaf without a file (Ctrl+S on the tree frame) in `ferramentas-de-teste/paginas-sei/`, so the "without a file" check matches the real tree. Test (critical, writes to the SEI): create the three in a test process.

## 7. Manual tests

In `TESTES-PENDENTES.md` (T…, Portuguese). Critical: the first creation of the three documents (stage 3).
