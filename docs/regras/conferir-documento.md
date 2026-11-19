# Check SEI documents (process number, timbre, footer, date, spacing)

**Sections**: Where and when · Process number · Before signing · Timbre and footer · Date · Spacing between parts · Settings

Decided in `specs/feitas/conferir-documento.md` (v0.26.0 to v0.26.9 and stage 7, 18/11/2026). Code: `comum/conferir-documento.js`, `comum/data-documento.js`, `comum/espacamento-documento.js` (pure rules, Node tests) and `sites/sei/` (`conferir-documento.js`, `data-documento.js`, `espacamento-documento.js`, `editor-espacamento.js`, `documento-visualizar.js`, `assinar-conferir.js`, `lista-assinaturas.js`, `bloco-assinatura.js`).

## Where and when

- Document page in the process tree, only if not signed yet ("Documento assinado eletronicamente" absent), and the editor window (`acao=editor_montar`). Signed documents are never touched (only warned before signing).
- Nothing is saved by the extension: it changes the editor text only after a click (spacing: automatically, see below) and the person clicks Salvar.
- Process number and date: every unit. Timbre and footer: only Campus Palmas units (SEI sigla with `/PAL/`).

## Process number

- Only the "Processo nº:" line at the top and, in Edital/Minuta, "(Processo Administrativo n° …)" in the title (an SEI link: only warned, D17). Numbers in the body are never checked. Ofícios have no such line.
- The process the document is in: "Referência: Processo nº …" below the document, or the tree / the SEI window that opened the editor; compared by digits only.
- Warning shows both numbers; "Corrigir o número do processo" only in the editor (replaces only that number); on the document page the button opens the editor.

## Before signing

- All four places (D2): "Assinar Documento" in the tree, "Assinar" in the editor (and Ctrl+Shift+A), the signature list ("Assinar e próximo" and ranges) and SEI's Bloco de assinatura. One window: "Assinar mesmo assim?"; list and Bloco: one window listing every wrong document.
- Only a wrong process number or a **wrong** date stops signing (a date only out of pattern does not). If the check fails or is slow, the SEI signs normally (never blocks).

## Timbre and footer

- Timbre: fixed lines "Ministério da Educação / Secretaria de Educação Profissional e Tecnológica / Instituto Federal de Educação, Ciência e Tecnologia do Tocantins / Campus Palmas" + the unit's sector lines from "Minhas unidades" (Gabinete PAL/REI/IFTO: "Gabinete da Direção-Geral"); a "Reitoria" line is always an error (D12). Invisible characters and trailing spaces ignored.
- Footer (D4, D11): address, CEP, Palmas/TO, phone, site, e-mail of the unit; compared by data only (formatting, "esquina com a" and the old site address ignored). Unit without saved phone/e-mail: any campus phone 63 3236-4000 to 4099 and palmas@ / <setor>.palmas@ifto.edu.br accepted (v0.26.7).
- "Corrigir timbre" / "Corrigir rodapé" in the editor; "Usar este timbre como padrão da unidade" copies the sector lines to "Minhas unidades" (with confirmation).

## Date

- The "Cidade, D de mês de AAAA." line (top or end of the body) or the end of a title in capitals in the first 15 paragraphs; dates cited in the body never count. Only unsigned documents, compared with today (D18–D20).
- Wrong: month or year different from today's, or a day still to come (Ofício/Portaria: also any past day). Pattern: "Palmas, 1º de dezembro de 2026." (no leading zero, "1º" only on day 1, lowercase month, final dot). "Corrigir para …" in the editor.

## Spacing between parts

- In SEI 5 the timbre and signer lines have line-height 10% and the "sem espaço" styles have no margin, so number, date, "Processo nº" block, recipient and signer's name touch.
- When the editor (SEI 5, CKEditor 5) opens an unsigned document without the spacing, the extension measures, for every type, the distance between the letters of the last line of each section and the first line of the next one, and also before and after the date line inside a section (D21: Atestes, body → date → signer). Under half a letter height = touching: the gap becomes one letter height (one blank line). Empty paragraphs in between (v0.29.3, T162): the distance is measured between the letters across them, because the Despacho's "Separador de seção" line (`IFTO_Alin_direita_sem_espaço`) has almost no height; only a real blank line (half a line or more) counts as spaced, so no repeated blank line. The gap from the signer's last line to the footer also gets the space (v0.29.3); lines inside a section, inside the footer and after it are never touched.
- Fix: a hidden `<style>` block (like v0.25.0; T123 showed the SEI keeps and prints it), recognized by the comment `extensao-ifto: espacamento`, put in the timbre's coat-of-arms paragraph (no text; "Corrigir timbre" keeps it), else in the first paragraph of the body. Rules: for the saved document and PDF, "previous paragraph + this one" by style (`p.A+p.B`; a third one before if the pair also occurs elsewhere; if still ambiguous, that gap is left as is); for the editor, by section name and position. Class names escaped (`\0000e7`), no quotes or ">" in the block.
- Added automatically; a box lists where and offers "Desfazer" (removes the block; nothing is remembered, so the next time the editor opens it is offered again, D23). Saved only when the person clicks Salvar. Documents that already have the block are left alone.
- With the editor open the document is never signed (the SEI removes the signature when the editor of a signed document is opened, D22): no check there.

## Settings

- Switches (all on by default, D10): "Número do processo", "Timbre", "Rodapé", "Data do documento" (also the editor button "Corrigir para …": data-documento D4), "Espaço entre as partes do documento"; "Copiar o nome de quem assinou" (D15). "Minhas unidades": sigla, phone, e-mail and sector lines, saved only in the browser.
