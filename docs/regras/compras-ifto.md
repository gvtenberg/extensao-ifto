# Compras IFTO pieces into the SEI

**Sections**: Where it works · From Compras IFTO to the extension · In the SEI · Safety

Decided with dcarvalho89 (CCL) on 16/11/2026; spec in `../specs/feitas/compras-ifto-no-sei.md` (v0.19.0 to v0.21.0).

## Where it works

- Compras IFTO: **only** `https://compras-ifto-teste-v1-mbro.onrender.com/` (not the computer's test copy), with an **optional permission** asked in the settings card "Licitação (CCL)" ("Permitir no Compras IFTO"). Colleagues who do not use Compras IFTO see nothing new.
- SEI: "Automática" = unit **`CCL/GAC/DAP/PAL/REI/IFTO`**; "Sempre ligada" = any unit; "Desligada". The bar button "N peças do Compras IFTO" shows only with a process open and pieces waiting.

## From Compras IFTO to the extension

- The bridge (`sites/compras-ifto/ponte.js`) marks `<html data-extensao-ifto="version">`; only then Compras IFTO shows "Enviar ao SEI" next to "Copiar para o SEI".
- The page sends `window.postMessage({ origem: 'compras-ifto', tipo: 'enviar-ao-sei', peca: { id, titulo, fase, processo, nup, objeto, html } })` (same HTML as "Copiar para o SEI"); the extension answers `{ origem: 'extensao-ifto', tipo: 'peca-recebida', id, ok, erro?, total? }`. Only messages from the page itself and that address count; other fields are dropped; HTML up to 1.5 MB.
- **A list** of pieces waits in the browser (`pecasCompras`, at most 20). The same piece (same Compras process and phase, `id`) sent again replaces the old one. A piece leaves the list when included with the text checked, or with "Tirar da lista".

## In the SEI

- Process: the **one open in the SEI**. If the piece's NUP is different, red warning; without NUP, a note.
- Type: read from the SEI's own "Incluir Documento" list; the closest to the phase name or title is suggested (`sugerirTipo`, at least half of the type's words); the user confirms or changes it.
- Access level: **Público** by default; Restrito asks for the hipótese legal from the SEI list.
- Same type already in the process (in the tree, or created today by the extension): yellow warning and a "Criar mesmo assim" box.
- "Criar e salvar" is the confirmation: the extension creates the document ("Texto inicial: Nenhum", so the type's header and footer stay), opens the editor in a popup window, puts the text in the **body** section and clicks **Salvar**. It **never signs**.
- Body section: the only editable one, or the one labeled "corpo"; if unclear, it stops without writing and shows the sections. Messages from the SEI during the save are shown; a question is answered "no".
- After saving, the text is checked on the document page. Any problem: yellow warning, the editor window stays open, the piece stays in the list.

## Safety

- The HTML is cleaned before the preview and before the editor (`limparHtml`: only text tags and text styles; no scripts, events or `javascript:` links). The preview is a sandboxed frame.
- No passwords or personal data travel; Compras IFTO is a test system with fictitious data.
