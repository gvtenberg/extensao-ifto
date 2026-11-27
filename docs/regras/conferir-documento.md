# Check SEI documents (process number, timbre, footer, date, spacing)

**Sections**: Where and when · Process number · Before signing · Timbre and footer · Capa de Processo · Date · Spacing between parts · Director-general title and Campus in italics · Settings

Decided in `specs/feitas/conferir-documento.md` (v0.26.0 to v0.26.9 and stage 7, 18/11/2026). Code: `comum/conferir-documento.js`, `comum/data-documento.js`, `comum/espacamento-documento.js` (pure rules, Node tests) and `sites/sei/` (`conferir-documento.js`, `data-documento.js`, `espacamento-documento.js`, `editor-espacamento.js`, `documento-visualizar.js`, `assinar-conferir.js`, `lista-assinaturas.js`, `bloco-assinatura.js`).

## Where and when

- Document page in the process tree, only if not signed yet ("Documento assinado eletronicamente" absent), and the editor window (`acao=editor_montar`). Signed documents are never checked nor touched, not even before signing (v0.34.2).
- Nothing is saved by the extension: it changes the editor text only after a click (spacing: automatically, see below) and the person clicks Salvar.
- Process number, date and italics: every unit. Director-general title: only PAL/REI/IFTO. Timbre and footer: only Campus Palmas units (SEI sigla with `/PAL/`).

## Process number

- Only the "Processo nº:" line at the top and, in Edital/Minuta, "(Processo Administrativo n° …)" in the title (an SEI link: only warned, D17). Numbers in the body are never checked. Ofícios have no such line.
- The process the document is in: "Referência: Processo nº …" below the document, or the tree / the SEI window that opened the editor; compared by digits only.
- Warning shows both numbers; "Corrigir o número do processo" only in the editor (replaces only that number); on the document page the button opens the editor.

## Before signing

- All four places (D2): "Assinar Documento" in the tree, "Assinar" in the editor (and Ctrl+Shift+A), the signature list ("Assinar e próximo" and ranges) and SEI's Bloco de assinatura. One window: "Assinar mesmo assim?"; list and Bloco: one window listing every wrong document.
- Only a wrong process number, a **wrong** date or a wrong director-general title (v0.35.2) stops signing (a date only out of pattern does not). v0.34.2: never for a document someone already signed (tree, list, Bloco); the window lists each divergence ("possíveis divergências", not "errado"). If the check fails or is slow, the SEI signs normally (never blocks).

## Timbre and footer

- Timbre: fixed lines "Ministério da Educação / Secretaria de Educação Profissional e Tecnológica / Instituto Federal de Educação, Ciência e Tecnologia do Tocantins / Campus Palmas" + the unit's sector lines from "Minhas unidades" (Gabinete PAL/REI/IFTO: "Gabinete da Direção-Geral"); v0.34.2 (user, 23/11/2026): a "Reitoria" line is never reported and "Corrigir timbre" keeps it in place (replaces D12); other lines are still checked. Invisible characters and trailing spaces ignored.
- Footer (D4, D11): address, CEP, Palmas/TO, phone, site, e-mail of the unit; compared by data only (formatting, "esquina com a" and the old site address ignored). Unit without saved phone/e-mail: any campus phone 63 3236-4000 to 4099 and palmas@ / <setor>.palmas@ifto.edu.br accepted (v0.26.7).
- v0.33.0 (user, 19/11/2026): every word of a timbre line starts with a capital letter, except linking words (de, da, do, e, em, para…) and the letter right after a hyphen (either case is fine); extra blank lines in the timbre (empty timbre paragraph without the coat of arms, or a line break `<br>` inside a line) are errors. "Corrigir timbre" fixes both.
- "Corrigir timbre" / "Corrigir rodapé" in the editor; "Usar este timbre como padrão da unidade" copies the sector lines to "Minhas unidades" (with confirmation).
- v0.35.3 (user, 24/11/2026): Campus Palmas unit missing sector lines, phone or e-mail in "Minhas unidades": the editor offers to save the missing ones from the document ("Guardar como padrão da unidade …" / "Agora não", asked again next time). The document is read again at the click and shown to confirm; saved only for the open unit (by sigla). Only campus phone/e-mail; "Reitoria" never saved. The settings page, if open, follows the change.

## Capa de Processo

- (v0.33.0) The Capa writes "Processo:" without "nº": the process number check also reads it. Data de Autuação, Tipo de Processo, Especificação and Interessado(s) are compared (case and spaces ignored) with the data the process screen read from "Consultar/Alterar Processo" (kept in the browser for the last 40 processes opened; process never opened: only the number is checked). Box "A capa não confere com os dados do processo" with "Corrigir a capa" (only the different fields; never saves). Part of the "Número do processo" setting.
- v0.36.2 (user, 25/11/2026): the Interessados go on one line, separated by "; " (one per line, as before, is also accepted).

## Date

- The "Cidade, D de mês de AAAA." line (top or end of the body) or the end of a title in capitals in the first 15 paragraphs; dates cited in the body never count. Only unsigned documents, compared with today (D18–D20).
- Wrong: month or year different from today's, a day still to come or a past day (v0.34.2, user, 23/11/2026: every type; before, past days only in Ofício/Portaria). Corrected only with the button. Pattern: "Palmas, 1º de dezembro de 2026." (no leading zero, "1º" only on day 1, lowercase month, final dot). "Corrigir para …" in the editor.

## Spacing between parts

- In SEI 5 the timbre and signer lines have line-height 10% and the "sem espaço" styles have no margin, so number, date, "Processo nº" block, recipient and signer's name touch.
- When the editor (SEI 5, CKEditor 5) opens an unsigned document without the spacing, the extension measures, for every type, the distance between the letters of the last line of each section and the first line of the next one, and also before and after the date line inside a section (D21: Atestes, body → date → signer). Under half a letter height = touching: the gap becomes one letter height (one blank line). v0.33.0 (Despacho 3392797, Capa de Processo, 19/11/2026): the distance is the one of the **saved document**, not of the editor (the editor shows each section in its own box, far apart, and shows separators the SEI does not save): what is left of the upper block, the real blank lines in between (measured height) and the margins. Not saved, so not counted: a section with only the editor's empty line (`<p><br data-cke-filler></p>`) and a blank-only section right after the timbre. A blank line that is saved counts by its height (half a line or more = spaced). A `div` box ("Processo/Interessado/Assunto") counts up to its own border. The gap from the signer's last line to the footer also gets the space (v0.29.3); lines inside a section, inside the footer and after it are never touched.
- v0.34.2 (user, 23/11/2026, Notificação 3394735), every type: after the timbre the gap is at least 1.5 lines; after the number (section "Identificador") at least 1 line. The measure is made with the extension's own block turned off (otherwise gaps already filled left the new block); an old block is also replaced when a margin differs by more than 0.1em.
- v0.36.2 (Despacho 3397868): a blank-only, read-only section right after the `div` box "Processo/Interessado/Assunto" also does not count: in a new Despacho it has a blank line on the first opening and the SEI drops it when saving (the space only came on the second opening). A blank line in an editable section counts.
- Fix: a hidden `<style>` block (like v0.25.0; T123 showed the SEI keeps and prints it), recognized by the comment `extensao-ifto: espacamento`, put in the timbre's coat-of-arms paragraph (no text; "Corrigir timbre" keeps it), else in the first paragraph of the body. Rules: for the saved document and PDF, "previous paragraph + this one" by style (`p.A+p.B`; a third one before if the pair also occurs elsewhere; if still ambiguous, that gap is left as is); for the editor, by section name and position. Class names escaped (`\0000e7`), no quotes or ">" in the block.
- Added automatically; a box lists where and offers "Desfazer" (removes the block; nothing is remembered, so the next time the editor opens it is offered again, D23). Saved only when the person clicks Salvar. v0.33.0: a document that already has the block is measured again; if the saved-document rules differ (gaps missing in the old block), the block is replaced and the box says "atualizou"; "Desfazer" then removes all the spacing.
- v0.35.3 (Solicitação de nota de empenho 3396459): the SEI saves an empty `<div style="counter-reset…">` after a section with numbered items, and sometimes the footer inside a `div`; the block also carries `A+div+B` (between sections, never where it would hit elsewhere) and `A+div p.rodape`.
- v0.37.0 (T267, 26/11/2026): "Usar este timbre como padrão da unidade" reads the document at the click; it leaves after "Corrigir timbre" and, when the current lines are already the saved ones, says so instead of saving.
- v0.37.0 (T249, T272, 26/11/2026): the footer also counts when the SEI puts it inside a box (`<div><p class="IFTO_Centralizado_rodape">`), so the line after the last signer is offered with two or more signers. A saved blank line in the signer's style counts as a space for the automatic spacing too, even thin (one rule for both parts); "Adicionar" waits for the automatic spacing to finish.
- v0.36.1 (user, 25/11/2026): the line before the signer is offered whatever comes before (text, date or table), and the one after, each only if missing; several signers separated by a blank line are handled. Extends v0.35.3:
- v0.35.3 (user, 24/11/2026): real blank line missing between the date line and the signer, or between the signer's last line and the footer: the box "Adicionar a linha em branco" inserts it (neighbour's style) only after the click, only in editable sections. Any blank line already there counts, even a thin one. Measured again at the click; the automatic spacing is then redone so they do not add up.
- With the editor open the document is never signed (the SEI removes the signature when the editor of a signed document is opened, D22): no check there.

## Director-general title and Campus in italics

Decided by the user on 24/11/2026 (v0.35.2).

- Title: the line below the name (alone on its line) of a person in the settings list "Pessoas e cargos" (`cargosPorUnidade`, one line "unidade = nome = cargo", #355, v0.37.0; default: PAL/REI/IFTO, Noemi Barreto Sales Zukowski, "Diretora-Geral do Campus Palmas") must be exactly that cargo, only in that unit; "Campus"/"Campi" of the cargo go in italics by themselves. Missing, "Pro Tempore" or only "Diretora-Geral" are warned. A line counts as the title if short and it speaks of direction or starts like the right cargo. A line that does not speak of direction is never replaced (the title is inserted after the name).
- Italics (every unit): each "Campus"/"Campi" (any case) outside italics, timbre and event names ("Campus Party") included. Not flagged: text in capitals (typed or by style), e-mails and web addresses. Notice only, never stops signing.
- Corrected only by click in the editor; "Corrigir timbre" also writes Campus in italics.

## Settings

- Switches (all on by default, D10): "Número do processo", "Timbre", "Rodapé", "Data do documento" (also the editor button "Corrigir para …": data-documento D4), "Campus e Campi em itálico", "Cargo da diretora-geral" (v0.35.2), "Espaço entre as partes do documento"; "Copiar o nome de quem assinou" (D15). "Minhas unidades": sigla, phone, e-mail and sector lines, saved only in the browser.
