# Browser extension – IFTO Campus Palmas (UG 158336)

@docs/claude-regras/regras/programacao.md

Extension for **Firefox** and Chrome (free package, v0.5.0) that goes with the campus Budget Management System: it improves the IFTO SEI and, with login, reads the system data from the Google Spreadsheet to fill documents and capture data on other sites (SEI, SUAP, SIAFI, SICAF, Simples Nacional, Comprasnet). Version in `manifest.json`. The main system lives in `../sistema-orcamento-ifto` (another repository): business rules and the spreadsheet are there; **do not copy**, read only the needed part.

## Language (12/11/2026)

- **Chat replies and all `.md` docs in English** (saves tokens; plain, simple English: the user is not from IT). Choice-window questions too.
- **Stay in Portuguese:** everything the extension shows (texts for its users), `TESTES-PENDENTES.md` (source of the GitHub test cards for the user and colleagues), `README.md`, code comments and identifiers.

## Economical reading

- **First command of the session, only on the owner's computers** (`git config user.name` is `gvtenberg`; anyone else skips it, see "Colleague's fork and pull requests"): `diff -q ~/.claude/CLAUDE.md docs/claude-regras/CLAUDE.md; diff -rq ~/.claude/regras docs/claude-regras/regras` (the user's general rules, identical on every computer). If they differ or the computer files are missing, follow "Same rules on every computer" in `docs/claude-regras/regras/programacao.md`.
- At the start **do not read** `docs/` or `TESTES-PENDENTES.md`. Read only what the task needs, only the needed part, and do not re-read what was already read in the session.
- Files with several sections have the "**Sections**" index on line 3: read the first 5 lines and search for the section title. `docs/historico.md`: search for the version (`v0.1.3`). `TESTES-PENDENTES.md`: `### T12` or the mark (see `/testes`); never the whole file. To resume work: only the "Status" section of `docs/melhorias-futuras.md`.
- Where things are: `docs/arquitetura.md` (file map) · `docs/regras/` (decided rules, one file per subject; list in `LEIA-ME.md`) · `docs/padrao-visual.md` (window, settings and what the extension adds to pages) · `docs/referencias/` (other extensions and sites, e.g. SEI++) · `docs/melhorias-futuras.md` (Status: done, in progress, pending; and the ideas, one line each) · `docs/specs/` (one spec per improvement in progress; finished in `feitas/`) · `docs/historico.md` (what went into each version) · `docs/claude-regras/` (copy of Claude's general rules, `~/.claude/CLAUDE.md` and `~/.claude/regras/`) · `docs/publicacao.md` (Mozilla signing via GitHub, installation, Chrome package, saved passwords) · `TESTES-PENDENTES.md` (root: manual tests T01, T02…). In the main system: `docs/planilha.md` (tabs and columns) and `docs/regras/`.

## Documentation (so another person or machine can continue)

- All `.md` files go into git (except what is in `ferramentas-de-teste/`). When changing code or a rule, update the right `.md` in the same commit (architecture, rules, history, tests, spec, Status).
- Done: `docs/historico.md` and `docs/specs/feitas/`. Pending: "Status" section of `docs/melhorias-futuras.md` (update at the end of each stage or round), `docs/specs/` and `TESTES-PENDENTES.md`. Do not create another file that repeats this.
- One subject per file; `##` titles that work as search terms; "**Sections**" index on line 3 when there are several sections (update it when creating or renaming a section); short texts, without repeating what is in another file (point to it).

## How we work (small specs)

1. **Plan** (`/planejar <improvement>`): interview the user and create `docs/specs/<name>.md` from `_modelo.md`, with small stages (each fits in one conversation).
2. **Decisions:** a choice that changes a rule, a screen, data read or written (spreadsheet, SEI) or that is hard to undo goes to "Decisions to confirm" with `[ ]`; **do not code** with a `[ ]` that affects the stage and never decide alone.
   - Every doubt is asked **in the chat as soon as it appears** (never left only in the spec nor waiting for the stage where it is used); the answer goes into the spec.
   - With alternatives, ask through the **choice window** (up to 4 questions at a time; the suggestion first; each question self-explanatory). Plain text only when there are no options.
3. **Execute** (`/etapa <spec> <n>`): read only the spec and what it points to. When done: tests, version, history, Status, commit and stage checked.
4. **End of the improvement:** rules to `docs/regras/`, the line leaves `melhorias-futuras.md`, spec to `docs/specs/feitas/`.
- Small fixes and test fixes do not need a spec.
- **Several specs at the same time** (18/11/2026, user): the user opens **one Claude chat per spec** (e.g. `/etapa base-e-sei 2-5` in one, `/etapa conferir-documento 7` in another), to watch the progress and answer the questions; do not start background agents for this. Each chat works in its own worktree.
- **Manual tests** (`/testes`): the user answers on the GitHub cards ("✅ Passou" / "❌ Falhou" and comments). Fix the failed ones, delete the passed ones from the file and add the new ones (new number, never reused).

## Who the user is

- Head of CGOC (Budget Management and Contracts Coordination), **not from IT**: plain language, no jargon; commands with the exact text to type and the click path in the browser.
- Ask when in doubt and give suggestions. Often sends several requests in one message.
- Big change, hard to undo, or that writes to an official system (SEI, spreadsheet): proposal + confirmation first.
- New permanent instruction: propose adding it here (in the right place), not only in the automatic memory.
- New ideas: one line in `docs/melhorias-futuras.md`. New rules: in the right file of `docs/regras/`.
- README.md (v0.9.4): the user manual for colleagues, in Portuguese (what it does, browsers, download and install, settings, data read, precautions, how to report errors) plus license. Update it when a feature, setting or install step changes; the contact text also appears on the settings page (same wording).
- **When the user leaves** and asks you to continue: do what is already decided (specs without `[ ]`), plan the rest and bring the questions in blocks at the end, with suggestions.

## Reply after changing code

- **What changed** (short) · **What I tested** (one line) · **Tests**: only number and title, one per line ("T11 – Instalar pelo GitHub"); the step-by-step stays only in `TESTES-PENDENTES.md`. A **critical** test goes in full in the reply.
- Do not list the changed files. Say which commits were made (and that they were not pushed to GitHub).
- **Long conversation:** when the conversation is large (several rounds or stages, many files read, or after the context was summarized automatically), end the reply with: "⚠️ The conversation is long: I recommend starting a new one. Type `/clear` (everything is already in git and in the docs)." Before that, leave everything committed and noted (spec, Status, tests, improvements).

## Tests

- `TESTES-PENDENTES.md` is **only** the source of the GitHub cards (the user does not read it), **in Portuguese**: compact, no instructions or result lines. Format: "## section", "> antes de testar" (optional, one line), "### Tnn – título (vX.Y.Z)" (+ " (Crítico)"), "F: o que fazer" and "E: o que deve acontecer" (one line each; summarized, only what the user and non-IT colleagues need: where to click and what should appear); question: "### Pn – título" and "?: pergunta". A test that depends on a file outside git: say in "> antes" that it is on the development computer.
- **GitHub cards** (`.github/workflows/testes.yml`): on each push, every new test or question becomes a card (issue, label "teste") with the full text and the "✅ Passou" and "❌ Falhou" boxes; cards of tests that leave the file close by themselves. `/testes` reads the cards with `node .github/scripts/ler-resultados.js` and deletes the resolved ones with `node .github/scripts/apagar-testes.js T03 T05` (do not read the whole file or cards).
- **Every test gets a card** (18/11/2026, user): a card belongs to a test by number **and** title. A test with a number already used by another test (e.g. the colleague's pull request merged while the owner has unpushed tests) still gets its card, marked "número repetido", and the "Cartões de teste" run turns red. Fix: renumber the **newer** test, the one without comments, to the next free number; never delete a test because its number repeats (only a truly repeated test, same content, is deleted). Owner: after bringing master from GitHub, run `npm test` (it refuses repeated numbers) and renumber your own unpushed tests. Never change the title of a test that already has a card. Cards closed by hand: `/testes` reads them too.
- An uncommented test = it worked. Never delete a test without "Passou" on the card (or the user's request). Only append at the end and check that the count did not go down.
- Improvement with several stages: each stage's tests go into the file, but the user tests everything together at the end. Only stop earlier for a **critical** test (writes to an official system – SEI, spreadsheet – or decides the direction of the next stage), marked "(Crítico)". Automated tests run at every stage.
- Minimum check: `npm test` and `npm run conferir`. **Never test with screenshots** (nor open the browser to see the screen) without the user's explicit request.

## Version and git

- **Version number (same rule for everyone: owner and colleagues), format `0.MIDDLE.LAST`:**
  - The next number after the last one in **master's** `docs/historico.md`; never skip, never reuse. Only `manifest.json` holds it, plus one or two lines in `docs/historico.md` with the date (dd/mm/yyyy).
  - **Middle +1** (last back to 0) only at the **first stage of a new improvement** (a new spec, or an old spec resumed with new features: one middle number per spec, 18/11/2026). Its other stages, fixes and small changes: **last +1**. Example: master at 0.21.1 → new improvement 0.22.0 → its stage 2 0.22.1 → a fix 0.22.2.
  - Changes not pushed yet share the open number (same line in `historico.md`). Each version pushed to GitHub is signed only once by Mozilla.
  - **Pull request from a fork:** one number for the whole pull request (stages inside the fork do not bump), taken only when updating the fork with master (next section). The pull request check refuses any other number.
- **No version, no signing** (15/11/2026): docs only (`.md`, `docs/`, `TESTES-PENDENTES.md`, `.claude/`) and the test-card files (`.github/workflows/testes.yml`, `.github/scripts/` except `baixar-assinada.js`) do not bump the version (commit "docs: …" or "ci: …"), and their push does not start "Assinar extensão" (`paths-ignore` in `assinar.yml`). Rule in `~/.claude/regras/programacao.md`.
- Commit without waiting to be asked: before each stage or round (if there are pending changes) and when finished, in the format **"vX.Y.Z: type: short summary"** (e.g. "v0.1.3: feat: procurar atualização na janela"; without a version change: "docs: summary"). Types: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`, `test`, `ci`. Check in `git status` that nothing from `ferramentas-de-teste/`, keys or `.xpi` got in.
- **Never `git push`** without being asked: the push triggers Mozilla signing (and GitHub Actions has usage limits). Say the commit was not pushed.

## Colleague's fork and pull requests (18/11/2026)

A colleague works in the fork `dcarvalho89/extensao-ifto` and sends pull requests to `gvtenberg/extensao-ifto`. If it is not you (`git config user.name` is not `gvtenberg`):
- **General rules:** this repository uses its own copy of the rules (`docs/claude-regras/`, the owner's); do not sync it with your `~/.claude/` (in either direction) and never change `docs/claude-regras/`. Your personal rules stay in your `~/.claude/`; where they differ, this file and `docs/claude-regras/` win in this project. A rule useful for everyone: write it as a suggestion in the pull request text.
- **Before opening or updating a pull request** (and again if GitHub says "This branch has conflicts" or "out-of-date"):
  1. `git fetch https://github.com/gvtenberg/extensao-ifto.git master` and `git merge FETCH_HEAD`.
  2. Own new tests renumbered to after the highest `T`/`P` number ever used in master (see the cards too) and moved to the end of `TESTES-PENDENTES.md`; version: one number for the pull request, the next after master's (rule in "Version and git").
  3. Conflicts: keep both sides' text, then delete every `<<<<<<<`, `=======` and `>>>>>>>` line (`npm test` fails if one is left).
  4. `npm test` and `npm run conferir` must pass; commit and push to the fork.
- **After pushing:** `gh pr checks <number> --repo gvtenberg/extensao-ifto --watch`. If "assinar" fails: `gh run view <run id> --repo gvtenberg/extensao-ifto --log-failed`, find the "Pull request recusado" lines and explain them to the user in plain words, with the fix (the check `.github/scripts/conferir-pull-request.js` refuses: outdated fork, version out of sequence, reused test number, change to `docs/claude-regras/`).
- **Owner (gvtenberg):** GitHub blocks the merge until the check is green and the branch is up to date (rule "Merge só com a conferência verde" in Settings > Rules). Do not use "bypass" with a red ✗: ask Claude to fix it.

## Commands

- `npm test` (rules in `testes/*.test.js`, Node runner; create a test for each new rule in `comum/`) · `npm run conferir` (Mozilla check, `web-ext lint --self-hosted`; at the end of each stage) · `npm run empacotar` (package in `web-ext-artifacts/`, outside git) · `npm run empacotar-chrome` (Chrome/Edge folder and `.zip` `extensao-ifto-chrome-edge-X.Y.Z` in `web-ext-artifacts/chrome/`; Firefox file in Releases: `extensao-ifto-firefox-X.Y.Z.xpi`, v0.18.1) · `npm run rodar` (test Firefox, clean profile without passwords) · `npm run rodar-sei` (19/11/2026: **the user's way to test before pushing**: separate test Firefox opening the SEI, profile kept in `ferramentas-de-teste/perfil-firefox-teste/` (SEI login stays, outside git), extension reloads by itself when a file is saved; spell check in pt-BR (system dictionary `/usr/share/hunspell`); close that Firefox window or Ctrl+C in the terminal to stop).
- Temporary install (only for the everyday Firefox; the "Recarregar" button exists only for temporary installs): `about:debugging#/runtime/this-firefox` > **Carregar extensão temporária…** > `manifest.json` from the `extensao-ifto` folder. It disappears when Firefox closes; after changing code, **Recarregar** there.
- GitHub (`.github/workflows/assinar.yml`): on each push it checks (`npm test`, `npm run conferir`); if the `manifest.json` version is new, it signs with Mozilla (unlisted) and publishes the `.xpi`, the Chrome `.zip` and `updates.json` in Releases. Step by step in `docs/publicacao.md`.
- `ferramentas-de-teste/` is in `.gitignore`: **never goes into git**; every local test or reference file (saved SEI pages, SEI++ packages) lives there. Never remove lines from `.gitignore` without permission (adding is fine, with notice).
- Keys and passwords (Google, Mozilla) never go into git: they live in `.env.local`, in GitHub secrets or in the browser settings.

## How it works (decided)

- **With login** (Google account @ifto.edu.br) the extension reads the system's Google Spreadsheet. **Without login**, only the SEI improvements. **No costs:** no paid services.
- **IFTO SEI:** every feature must work on the version used at IFTO (currently SEI 5.0.4; see `docs/regras/sei.md`). The extension acts only on `sei.ifto.edu.br`.
- **Installation:** signed by Mozilla as "unlisted" (free, outside the store), via GitHub; public repository, automatic update and "Procurar atualização" button in the icon window (checks; if there is a new version, opens its page; v0.17.2). Chrome: free package loaded in developer mode (no store, no automatic update).

## Conventions

- Plain JavaScript, no build step, Manifest V3. Pure rules (no page) in `comum/`, working in the browser and in Node (`module.exports` or `globalThis.ExtensaoIFTO`); page code in `sites/<site>/`.
- **Reuse functions** (12/11/2026): before writing a new function, look for one that already does it (`comum/`); a rule used by two features moves to the shared file (e.g. `comum/sei.js`) instead of being copied. Less code, lighter extension.
- Short comments in Portuguese explaining **why**, with the version when it is a new rule (`// v0.2.0: ...`).
- Extension texts in plain Portuguese, no unexplained acronyms, **written for the people who use the extension, not for the programmer** (v0.4.1): no GitHub, Actions, code, push, signed version, file names or technical terms; what is for the programmer goes in `docs/` (rule in `docs/padrao-visual.md`).
- Values in the same format as the system ("R$ 1.234,56"); budget types are **never** added together.
- Never write anything to an official system (SEI, spreadsheet, SIAFI…) without the user seeing and confirming first. Exception decided on 12/11/2026: "Assinar e próximo" — the user's click is the confirmation for that document (`docs/regras/lista-assinaturas.md`).
