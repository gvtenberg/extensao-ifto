# IFTO SEI: process and document screens

**Sections**: New process and process screen (v0.33.0) · Duplicate a document (v0.36.0) · Full name in the tree (v0.37.0)

## New process and process screen (v0.33.0)

- New process ("Iniciar Processo", "Iniciar Processo Relacionado": `procedimento_gerar`, `procedimento_gerar_relacionado`): "Público" checked when no level is checked, like the new internal document (setting `preencherDocumentoExterno`).
- Process screen (`arvore_visualizar` frame, inner page with `#divArvoreInformacao`): the extension opens the SEI's own "Consultar/Alterar Processo" page (`procedimento_alterar`, else `procedimento_consultar`, link from the page) only to read it (GET, 20 s limit, never saves) and shows Tipo do Processo, Especificação and Interessados below the SEI text, same font and size (like SEI++). SEI slow or down: a grey line says so. Setting `dadosDoProcesso` (on). The data is kept in the browser (`dadosDosProcessos`, last 40) for the Capa check (`regras/conferir-documento.md`).

## Duplicate a document (v0.36.0)

- "Duplicar documento" in the document icon menu (first option; switch `duplicarDocumento`, on by default): documents made in the SEI editor (`documento_interno` icon), signed or not, any unit, with "Incluir Documento" in the process; since v0.37.0 also external documents (below). Not for e-mail, form, cancelled or blank SEI documents.
- Opens the SEI's new document form in the document frame with the same type and the original as Documento Modelo. v0.37.0 (#355, user 27/11/2026): when everything was copied, the extension clicks the SEI's own Salvar (the SEI checks the fields, creates the document and opens the editor, as for a new document made by hand); the click on "Duplicar documento" is the confirmation. Anything not copied (registration not readable, level, Hipótese Legal): the form stays open with the notices and Salvar is the user's. Nothing is stored.
- **External document** (v0.37.0, #355, user 27/11/2026): own unit only (needs the "Alterar" link). Reads the original's "Alterar Documento Externo" and saves a new external document of the same type with: date, Número, Nome na Árvore, value, description, format and conferência, Remetente, Interessados, Destinatários, Classificação, Observações, access level, Grau de sigilo, Hipótese Legal. **Never the file**: the copy stays empty in the tree. Then the tree reloads and the new document is clicked, so the user can drop the PDF on its page. Saved directly (the click is the confirmation).
- Copied from the original's registration (`documento_alterar`, GET only): Descrição, Interessados, Destinatários, Assuntos (the original's list replaces the SEI's suggestion; an empty list leaves it empty, user 24/11/2026) and access level with Hipótese Legal. Not copied: Número, Nome na Árvore, Sigiloso (level left unmarked).
- Registration not readable (e.g. another unit's): type from the tree label only if sure (after the type name only a number), notice, level unmarked; the automatic "Público" does not act on this form.
- Type not in the unit's Incluir Documento list: warning only. SEI down or slow: time limit, Cancelar button, the document on screen stays.

## Full name in the tree (v0.37.0)

- #355: the tree is narrow and cuts long names. Every document name in the tree (SEI and external) gets the full name as the mouse-over hint (`title`); folders opened later get it too (`sites/sei/arvore-nomes.js`).
