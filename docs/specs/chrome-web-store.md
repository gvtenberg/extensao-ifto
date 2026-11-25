# Publish in the Chrome Web Store (unlisted)

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests · 8. Step by step (store) · 9. Privacy page

- **Status:** draft (to be planned better with `/planejar chrome-web-store`)
- **Requested on:** 18/11/2026 · **Deadline or priority:** not set
- **Planned version:** 0.NN.0 (next middle number when coding starts)

## 1. Goal (what for)

Colleagues on Chrome (and Edge) install the extension from a store link and get updates by themselves, instead of the developer-mode package (`publicacao.md`, "Chrome version").

## 2. Out of scope

- Public listing (it stays "unlisted": only people with the link find it).
- Edge Add-ons store (free; can be a later idea).
- Changing how Firefox is published (Mozilla signing via GitHub stays).

## 3. Decisions to confirm

- [x] D1 – Account: personal Google account (the IFTO account cannot use the store), one-time US$5 fee, visibility "unlisted" (user, 18/11/2026).
- [ ] D2 – The US$5 breaks the "no costs" rule (`AGENTS.md`, "How it works"). Write an exception there? Suggestion: yes, "one-time fee for the Chrome store, paid by the owner".
- [ ] D3 – Where the privacy page lives: (a) page in the GitHub repository (`PRIVACIDADE.md`, public link) (b) GitHub Pages site. Suggestion: (a), no extra setup.
- [ ] D4 – Upload of each new version: (a) by hand in the store dashboard (b) automatic by GitHub Actions (Chrome Web Store API, keys in GitHub secrets). Suggestion: (a) at first; (b) later if it becomes tiring.
- [ ] D5 – Keep offering the developer-mode `.zip` in Releases after the store version exists? Suggestion: yes for a while, then remove from the README.
- [ ] D6 – Name, short description and screenshots shown in the store (Portuguese). Suggestion: "Extensão IFTO Palmas", text taken from the README.

## 4. Decided rules

- Unlisted, personal account of the owner; the store reviews every version (a few days).

## 5. What changes

- Knock-on effects to check while planning:
  - The store version gets **its own extension ID** (different from the developer-mode one): settings saved in the old installation do not move; colleagues must reinstall and set it up again. Future Google login (`specs/base-e-sei.md`) must use the store ID.
  - Every site permission must be justified in the store form; the optional permissions (Comprasnet, Receita, Gov.br, Compras IFTO) help the review because they are asked only when the person turns the feature on (LGPD rule in `programacao.md`, "Knock-on effects").
  - The store forbids code loaded from the internet and asks for a single purpose: check `biblioteca/` (pdf.js) and the Mozilla warnings (`npm run conferir`).
  - `scripts/empacotar-chrome.js` already removes the Firefox-only part (`browser_specific_settings`, with its `update_url`); check that the `.zip` has nothing from tests.
  - The "Procurar atualização" button: in the store version Chrome updates by itself; decide if the button opens the store page.
  - README, settings page and `publicacao.md` must explain the new way to install.
- Data read or written: none new.
- Likely files: `PRIVACIDADE.md` (or the page chosen in D3), `scripts/empacotar-chrome.js`, `README.md`, `docs/publicacao.md`, `janela/` (update button).

## 6. Stages

- [ ] Stage 1 – Prepare: privacy page, store texts and screenshots, package check (no costs yet).
- [ ] Stage 2 – Owner creates the account and sends the first version (step by step in section 8); fix what the review asks.
- [ ] Stage 3 – After approval: README, settings page, `publicacao.md`, update button; tests with colleagues.

## 7. Manual tests

In `TESTES-PENDENTES.md` when coding starts (install from the store link, automatic update, settings kept after an update, optional permissions asked only when turned on).

## 8. Step by step (store)

1. With the personal Gmail, open `https://chrome.google.com/webstore/devconsole`, accept the terms and pay US$5 (card). Confirm the contact email; Google may ask for an identity check.
2. **Novo item** → upload the `.zip` from `npm run empacotar-chrome` (`web-ext-artifacts/chrome/`).
3. **Página da loja**: name, short and long description (Portuguese), category "Produtividade", 128×128 icon, at least one 1280×800 screenshot, support link (GitHub issues).
4. **Privacidade**: single purpose (help the IFTO Campus Palmas team in the SEI and related government sites); justify each permission (`storage`, `contextMenus`, `scripting`, each site); say no remote code is used; data use: what is read and that nothing is sold or sent to third parties; link to the privacy page (section 9).
5. **Distribuição**: visibility **Não listada**; countries: Brazil (or all).
6. **Enviar para análise**. Wait for the email (usually a few days; longer with many sites). If refused, the email says why: fix, bump the version, send again.
7. After approval: copy the store link to the README and the settings page; colleagues install from it (Chrome and Edge).
8. Each new version: same version number as Firefox; upload the new `.zip` in the dashboard (**Pacote** → **Enviar novo pacote**) and send for review again.

Tests possible before paying: install the `.zip` folder in Chrome with **Carregar sem compactação** and try the main features; check the package (no code from the internet, no unused permissions, no test files). There is no official tool that predicts the review.

## 9. Privacy page (draft topics, in Portuguese when written)

- Who makes it (CGOC, IFTO Campus Palmas) and contact.
- What the extension reads: pages of `sei.ifto.edu.br`; only when the person turns them on, SICAF, Simples Nacional, Comprasnet, Gov.br login and Compras IFTO; settings saved only in the browser.
- What it writes: only in the SEI, after the person sees and confirms (or clicks Salvar).
- What it does **not** do: no sale or sharing of data, no ads, no tracking, no data sent to servers of the extension (there are none); passwords stay in the browser.
- Downloads: PDFs saved in the person's Downloads folder only when that setting is on.
- How to remove data: uninstall the extension (or clear its data in the browser).
- Date of the last update of the page.
