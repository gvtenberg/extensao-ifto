# Future improvements and project status

**Sections**: Status (done, in progress, pending) · Ideas (Suggested order · Other sites · Distribution)

## Status (done, in progress, pending)

Summary to resume work (on another machine or by another person) without reading everything. Update at the end of each stage or round.

- **Done:** each version in `historico.md` (latest: v0.5.0, 12/11/2026); finished specs in `specs/feitas/` (signature list in the SEI, v0.2.0 to v0.5.0; rules in `regras/lista-assinaturas.md`).
- **In progress:** `specs/base-e-sei.md`: stage 1 done (v0.1.0); next, stage 2, waiting for decisions D7 and D9 to D13 (questions P1 to P4 and surveys T06 and T07 in `TESTES-PENDENTES.md`).
- **Fixes outside a spec:** v0.1.1, password recognized by the browser in SEI 5; v0.1.2, automatic update via GitHub; v0.1.3, "Procurar atualização" button and organization matching the main system; v0.4.1, texts reviewed for the people who use the extension; v0.4.2, install the update via the version page; v0.5.0, "Assinar e próximo", Chrome package, docs in English.
- **Pending from the user:** tests T01 to T27 (T20 and T23 critical: signing from the panel) and questions P1 to P4 (also as GitHub cards, after the first `git push`) (the SEI became SEI 5 in 11/2026: redo T03 to T05); Mozilla keys for signing on GitHub (`publicacao.md`); push the commits (v0.2.0 to v0.5.0 are not on GitHub yet).
- **Planned (with spec):** lines marked **[spec]** below. **Not planned:** the other lines (ideas).

## Ideas

One line per idea. When an idea is planned, it gets a spec in `docs/specs/` and the line points to it. When finished, the line leaves here and goes to `docs/historico.md`.

Marks: **[spec]** already has a spec.

### Suggested order (to confirm with the user)

1. Extension base and SEI improvements (replacing SEI++, which stopped working on the IFTO SEI): New document button, pre-filled external document, drag files with the type recognized, checklists per process type **[spec]** → `specs/base-e-sei.md`
   - Add files directly to a SEI 5 process (12/11/2026): already stage 3 of the spec ("Arrastar arquivos"). An IFTO colleague managed this in their own extension on SEI 5: ask for the extension's name or address and note it in `referencias/` before stage 3.
   - Later: **automatic PDF compression** inside the extension (26/10/2026): compress, compare sizes, report how much is saved on the Rectorate file server, and show the original and compressed PDF side by side so the user sees the quality difference and picks one. Mandatory above 10 MB. Preferably without sending the file to outside sites (D13 of the spec).
   - **Automatic save / backup copy in the SEI editor** (12/11/2026): after a connection drop the SEI showed "Ocorreu um erro ao tentar salvar o documento" and a long edit was nearly lost. Idea: while editing, keep a copy of each editable section (CKEditor 5, `element.ckeditorInstance.getData()`) in the browser storage every few seconds and offer "Restaurar a cópia" when the same document opens again; optional: click the SEI "Salvar" automatically every N minutes (to confirm with the user: it writes to the SEI). Saved pages and the editor JS: `ferramentas-de-teste/paginas-sei/` (`SEI_IFTO - 3384558 - Minuta de Edital*`). Learned on 12/11/2026: one multi-root editor at `window.infraEditor.editor`; Salvar sends `getFullData()` + `plugins.get('Comentario').getData()` (comments are separate from the text, positioned by the `data-c` of each paragraph); a copy can be reloaded with `infraEditor.montar({initialData, infra:{comentario:{itens}}})` after destroying the editors.
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

- Chrome version: free package without the store, done in v0.5.0 (`publicacao.md`, "Chrome version"). Chrome Web Store (US$ 5 fee, automatic updates) only if the "no costs" rule changes.
- When the extension leaves development: decide whether the "Procurar atualização" button leaves the icon window (12/11/2026).
- Mozilla "unlisted" signing via GitHub, with automatic updates: prepared in v0.1.1 and v0.1.2 (`publicacao.md`); the user still has to create the keys. Later, maybe, for campus colleagues. Colleagues currently use SEI Pro.
