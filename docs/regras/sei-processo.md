# IFTO SEI: process and document screens

**Sections**: New process and process screen (v0.33.0) · Duplicate a document (v0.36.0)

## New process and process screen (v0.33.0)

- New process ("Iniciar Processo", "Iniciar Processo Relacionado": `procedimento_gerar`, `procedimento_gerar_relacionado`): "Público" checked when no level is checked, like the new internal document (setting `preencherDocumentoExterno`).
- Process screen (`arvore_visualizar` frame, inner page with `#divArvoreInformacao`): the extension opens the SEI's own "Consultar/Alterar Processo" page (`procedimento_alterar`, else `procedimento_consultar`, link from the page) only to read it (GET, 20 s limit, never saves) and shows Tipo do Processo, Especificação and Interessados below the SEI text, same font and size (like SEI++). SEI slow or down: a grey line says so. Setting `dadosDoProcesso` (on). The data is kept in the browser (`dadosDosProcessos`, last 40) for the Capa check (`regras/conferir-documento.md`).

## Duplicate a document (v0.36.0)

- "Duplicar documento" in the document icon menu (first option; switch `duplicarDocumento`, on by default): only documents made in the SEI editor (`documento_interno` icon), signed or not, any unit, with "Incluir Documento" in the process. Not for external, e-mail, form, cancelled or blank documents.
- Opens the SEI's new document form in the document frame with the same type and the original as Documento Modelo. Never saves: Salvar is the user's click. Pages are only read; nothing is stored.
- Copied from the original's registration (`documento_alterar`, GET only): Descrição, Interessados, Destinatários, Assuntos (the original's list replaces the SEI's suggestion; an empty list leaves it empty, user 24/11/2026) and access level with Hipótese Legal. Not copied: Número, Nome na Árvore, Sigiloso (level left unmarked).
- Registration not readable (e.g. another unit's): type from the tree label only if sure (after the type name only a number), notice, level unmarked; the automatic "Público" does not act on this form.
- Type not in the unit's Incluir Documento list: warning only. SEI down or slow: time limit, Cancelar button, the document on screen stays.
