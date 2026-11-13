# Publishing: Mozilla signing via GitHub, and the Chrome package

Firefox only installs an extension permanently if Mozilla has signed it. We use **unlisted** signing (free, not shown in the store). GitHub does the signing, and the extension is downloaded straight from GitHub, so nothing has to be sent from the development computer.

**Sections**: How it works · One-time setup (Mozilla keys) · Publish a new version · Install on a computer (Firefox) · Chrome version · Saved passwords in the SEI · Common problems

## How it works

- File `.github/workflows/assinar.yml`. It runs when a commit that changes `manifest.json` reaches GitHub (or from the **Run workflow** button on the **Actions** tab).
- It runs `npm test` and `npm run conferir`, signs with `web-ext sign --channel unlisted`, and creates the `vX.Y.Z` version in **Releases** with `extensao-ifto-firefox-X.Y.Z.xpi` (Firefox) and `extensao-ifto-chrome-edge-X.Y.Z.zip` (Chrome, v0.5.0).
- The Release also carries `updates.json`. `manifest.json` points to the one in the latest Release (`update_url`), so Firefox installs each new version by itself (the repository is **public**).
- If the `manifest.json` version already has a Release, it does nothing: Mozilla does not sign the same version twice (that is why the version goes up with every change).

## One-time setup (Mozilla keys)

1. Go to https://addons.mozilla.org/pt-BR/developers/ with a Mozilla account (create one if needed) and accept the developer agreement.
2. Open https://addons.mozilla.org/pt-BR/developers/addon/api/key/ and click **Gerar novas credenciais** (Generate new credentials). It shows the **JWT issuer** (starts with `user:`) and the **JWT secret**.
3. On GitHub, open the repository > **Settings** > **Secrets and variables** > **Actions** > **New repository secret** and create two secrets:
   - name `AMO_JWT_ISSUER`, value: the JWT issuer;
   - name `AMO_JWT_SECRET`, value: the JWT secret.
4. The keys never go into git or into project files.

## Publish a new version

1. On the development computer, after the commit (Claude commits but does not push), send it to GitHub: in the terminal, inside the `extensao-ifto` folder, type `git push`.
2. On GitHub, **Actions** tab: follow "Assinar extensão" (a few minutes; Mozilla checks the package).
3. Done: the `.xpi` and the Chrome `.zip` show up in **Releases** (right side of the repository page).
- (v0.9.4) A push that only changes text files (`.md`, `docs/`, `LICENSE`, `.claude/`) does not start "Assinar extensão" (`paths-ignore`). Most of the run time (about 4 minutes) is Mozilla's own review queue: it cannot be shortened on our side; pushing several versions together signs only the latest one.

## Install on a computer (Firefox)

1. In the work Firefox, open the repository **Releases** page and click `extensao-ifto-firefox-X.Y.Z.xpi`.
2. Firefox asks whether to add the extension: click **Adicionar** (Add).
3. Only the first time. After that Firefox updates by itself (it checks once a day). To update right away:
   - **Firefox menu (most reliable):** menu ☰ > **Extensões e temas** (Add-ons and themes) > gear ⚙ > **Procurar atualizações** (Check for updates).
   - **Extension window (v0.17.0):** extension icon > **Procurar atualização** > (only when there is a new version) **Abrir a página da versão …** (user request of 13/11/2026: no install from the window, no extra link) > click `extensao-ifto-firefox-X.Y.Z.xpi` > **Permitir** > **Adicionar**. Before (v0.9.7): **Procurar atualização** > **Abrir a página da versão …** > click `extensao-ifto-firefox-X.Y.Z.xpi` > **Permitir** > **Adicionar**. The direct link of v0.9.1 and the automatic update did not work for the user (13/11/2026), although `updates.json` and the signed `.xpi` were correct online. Old (v0.9.1): extension icon > **Procurar atualização** > **Instalar a versão …** (a direct link to the `.xpi`) > **Permitir** (Allow, for GitHub) > **Adicionar**; a small link opens the version page as a backup. Before v0.9.1 it opened the version page and the user clicked `extensao-ifto-firefox-X.Y.Z.xpi` there (v0.4.2: opening the file directly did not show the install prompt, because Firefox requires the person's own click; Firefox has no `runtime.requestUpdateCheck`).
   - Settings and the signature list are kept.
- The version-page button is useful while the extension is in development; when it is ready, the user decides whether it leaves the window.

## Chrome version

Free, without the Chrome Web Store (the store charges a one-time US$ 5 developer fee, which breaks the "no costs" rule). Works in Google Chrome and Microsoft Edge. No automatic updates: each new version is installed by replacing the folder.

- **Build (development computer):** in the terminal, inside `extensao-ifto`, type `npm run empacotar-chrome`. It creates the folder and the `.zip` in `web-ext-artifacts/chrome/` (outside git). The script (`scripts/empacotar-chrome.js`) swaps the SVG icon for PNGs (`icones/icone-16/32/48/128.png`) and removes the Firefox-only keys. GitHub also attaches the `.zip` to each Release.
- **Install (first time):**
  1. Download `extensao-ifto-chrome-edge-X.Y.Z.zip` from the repository **Releases** page.
  2. Unzip it into a folder that will stay put (e.g. `Documentos\extensao-ifto-chrome`): right-click the file > **Extrair tudo** (Extract all).
  3. In Chrome, type `chrome://extensions` in the address bar and press Enter (in Edge: `edge://extensions`).
  4. Turn on **Modo do desenvolvedor** (Developer mode), top right (in Edge: bottom left).
  5. Click **Carregar sem compactação** (Load unpacked) and choose the unzipped folder (the one that contains `manifest.json`).
  6. Optional: puzzle-piece icon 🧩 next to the address bar > pin "Extensão IFTO Palmas".
- **Update:** download the new `.zip`, unzip it **over the same folder** (replace the files), then in `chrome://extensions` click the circular arrow ↻ on the extension card. Settings and the list are kept.
- In Chrome the "Procurar atualização" button also shows (v0.17.2): the same page has the Chrome `.zip`.
- Chrome may show a "Desativar extensões no modo do desenvolvedor" (disable developer-mode extensions) warning at startup: click to keep them.

## Saved passwords in the SEI

Firefox suggests passwords saved for **any** `ifto.edu.br` address (SUAP, Moodle, etc.) on the SEI. The extension cannot change this; it is a Firefox setting. To show only the SEI password (`sei.ifto.edu.br`):

1. Type `about:config` in the address bar and press Enter; click **Aceitar o risco e continuar** (Accept the risk and continue).
2. In the search box, type `signon.includeOtherSubdomainsInLookup`.
3. Click the toggle button ⇄ on the right so the value becomes `false`.

With only one password for `sei.ifto.edu.br`, Firefox fills it in by itself in the signing window, and "Assinar e próximo" signs with one click (v0.5.0).

## Common problems

- Signing failed ("Version already exists", "fetch failed" or any other error after the upload): since 12/11/2026 the workflow does not give up. It checks whether Mozilla already has the version (`.github/scripts/baixar-assinada.js`, AMO API v5); if yes, it downloads the signed `.xpi` (waits up to 30 min if still signing; retries when the connection drops or Mozilla is busy) and publishes the Release normally; if not (exit 2), it uploads again (up to 3 times) only when the failure was a connection drop; any other Mozilla error (package refused, wrong key) stops at once with Mozilla's message. "fetch failed" (0.9.4) = a short connection drop while waiting for approval. To retry by hand: Actions > Assinar extensão > Run workflow. Only bump the version if Mozilla refused it ("disabled"). Do not cancel a run during "Assinar na Mozilla"; runs never overlap (`concurrency`).
- Missing key ("API key" or "401"): check the two secrets from step 3 of "One-time setup".
