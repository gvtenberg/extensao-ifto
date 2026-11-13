# General extension rules

**Sections**: Browsers and installation · Login and data

Decided on 25/10/2026.

## Browsers and installation

- **Firefox** first; then **Chrome** (free package without the store, v0.5.0: `../publicacao.md`, "Chrome version").
- For tests on the user's browser: **temporary install** (`about:debugging#/runtime/this-firefox` > Carregar extensão temporária…), which disappears when Firefox closes.
- To install permanently: Mozilla **unlisted** signing (free, not in the store). Requested by the user on 12/11/2026: done **on GitHub**, to install on the work computer without going through the development one (`../publicacao.md`). **Public** repository, with automatic update via GitHub (v0.1.2) and the "Procurar atualização" button in the icon window (v0.1.3, while in development; v0.4.2 opens the version page because Firefox requires the person's click to install; v0.17.0, at the user's request: only the button "Abrir a página da versão mais nova", no search in the window).

## Login and data

- **With login** in the extension (Google account @ifto.edu.br): the extension reads the data **directly from the system's Google Spreadsheet** (the same official spreadsheet; tabs and columns in `../sistema-orcamento-ifto/docs/planilha.md`).
- **Without login:** only the SEI improvements work.
- No costs: no paid services (as in the system).
- Never write anything to an official system (SEI, spreadsheet, SIAFI…) without the user seeing and confirming first. Exception (12/11/2026): "Assinar e próximo" in the signature list, where the user's click confirms that document (`lista-assinaturas.md`).
