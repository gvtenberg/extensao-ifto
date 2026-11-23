# Extension visual pattern

**Sections**: Icon window and settings (the extension's own pages) · What the extension adds to pages (SEI and other sites)

Follows the system's pattern (`../sistema-orcamento-ifto/docs/padrao-visual.md`), so the extension looks like part of it. Only the differences are here.

## Icon window and settings (the extension's own pages)

- Same colors, font (IBM Plex Sans), corners and text sizes as the system. Main ones: background #F5F6F4, card #FFFFFF, border #E2E6E3, text #1B2420, secondary text #5B6660, highlight (`marca`) #1E5E33 only on the main button and the active item, error #9B1C1C, pending #7A4B00.
- Buttons and fields 44 px tall; only one main button per area.
- Messages close to the action; long explanations behind a (?) button.
- **Texts for the people who use the extension** (12/11/2026, v0.4.1): campus staff, not from IT, in Portuguese. No instructions for the programmer (GitHub, Actions, "push the code", signed version, file names, technical terms). Say what happened and what the person can do (e.g. "Ainda não há versão para instalar. Tente de novo mais tarde."). Applies to the icon window, the settings and what the extension adds to pages.

## What the extension adds to pages (SEI and other sites)

- **Discreet and in the site's style**, not the system's: what is added should look like part of the page.
- Everything the extension adds is identifiable (e.g. a small extension icon), so the user knows what belongs to the site and what to the extension.
- Do not change what the site already shows unless the user turns the feature on in the settings. Exception (v0.3.0): features of the open SEI unit's profile may come on ("Automática"), like the signature list in the Director-General's office; the user can turn them off.
- **Floating panel** (v0.2.0, signature list): sits above the page, can be dragged and minimized and remembers its position; isolated from the site's style (shadow DOM), with the green "IFTO" tag and the system colors; 32 px buttons because it is compact. Default place: top right, to the right of the process button bar.
- **Extension bar** (v0.7.0): one bar at the top right, same place in every unit; each feature turned on adds its button ("Lista de assinaturas", "N notas sem SICAF ou Simples – Buscar"; v0.18.0: the blank-documents button left); since v0.17.4 they sit in one small box with a single "IFTO" tag, one under the other (side by side they covered the SEI links). Panels open right below it. **Shown only when a feature of the open unit has a button on that page** (12/11/2026, user): Direção-geral (signature list, every page), CGOC (only with a process open); other units with "Automática": no bar. CCL (v0.19.0): "N peças do Compras IFTO" only with a process open and pieces waiting.
- **Items in the SEI's document icon menu** (v0.35.0, list for the director): same style as the menu, with the green "IFTO" tag, just above "Fechar".
- **Editor window box** (v0.22.0, MINUTA mark): the SEI editor has no extension bar; a small box with the "IFTO" tag sits at the bottom right (does not cover the editor toolbar), closable with ×, only while there is something to do. **One notice window** (v0.26.8, user, 19/11/2026): every notice (MINUTA, date, numbering, process number, timbre, footer, spacing), in the editor and on the document page, goes into this single window, one section each with its own button and ×; fixed on screen while scrolling, draggable by its top bar (place not saved). Opening the editor closes the notices of the document page (v0.35.1). New windows always on the **right** side, never covering half the page.
- **Extra styles in the editor list** (v0.29.0): extension styles after the type's own, "★ " before the name and a small grey note at the end of the list.
- **SEI version warning** (v0.28.0): on an untested SEI version, a box at the top right of the main SEI pages (orange border, "IFTO" tag) with "Continuar usando" and "Desativar a extensão no SEI"; shown until the person chooses.
- **Settings page** (v0.7.0; v0.26.0 reorganized): side menu (Geral, Documentos do SEI, Minhas unidades, Direção-geral, SICAF e Simples, Licitação, Cópia das configurações (base-e-sei stage 5), Dicas, Ajuda; on a phone the menu goes on top), one group at a time, small cards, one line per option with a short hint below; per-unit features keep Automática / Sempre ligada / Desligada. Last card (v0.9.4): "Erros e sugestões de melhoria" (talk to the person in charge at the CGOC, or a GitHub request for those with an account; same text as the README).
