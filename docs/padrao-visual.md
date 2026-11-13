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
- **Extension bar** (v0.7.0): one bar at the top right, same place in every unit; each feature turned on adds its button with the "IFTO" tag ("Lista de assinaturas", "Incluir Sicaf, Consulta e Anexo"), side by side. Panels open right below it. **Shown only when a feature of the open unit has a button on that page** (12/11/2026, user): Direção-geral (signature list, every page), CGOC (only with a process open); other units with "Automática": no bar.
- **Settings page** (v0.7.0): general settings first (all units), then one card per unit ("Por unidade"), each with Automática / Sempre ligada / Desligada.
