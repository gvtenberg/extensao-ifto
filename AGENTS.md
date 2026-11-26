# Browser extension – IFTO Campus Palmas (UG 158336)

**Sections**: Language · Economical reading · Documentation · How we work · Who the user is · Reply after changing code · Tests · Version and git · Commands · How it works · Conventions

Rules for any AI or person who works here (`CLAUDE.md` only imports this file). Programming: read `docs/claude-regras/regras/programacao.md` once at the start of the session (general rules: pull requests, review, engineering, security). Where they differ, this file wins.

Extension for **Firefox** and Chrome (free package, v0.5.0) that goes with the campus Budget Management System: it improves the IFTO SEI and, with login, reads the system data from the Google Spreadsheet to fill documents and capture data on other sites (SEI, SUAP, SIAFI, SICAF, Simples Nacional, Comprasnet). Version in `manifest.json`. The main system lives in `../sistema-orcamento-ifto` (another repository): business rules and the spreadsheet are there; **do not copy**, read only the needed part.

## Language (12/11/2026)

- **Chat replies and all `.md` docs in English** (saves tokens; plain, simple English: the user is not from IT). Choice-window questions too.
- **Stay in Portuguese:** everything the extension shows (texts for its users), `TESTES-PENDENTES.md` (source of the GitHub test cards for the user and colleagues), `README.md`, code comments and identifiers.

## Economical reading

- **First command of the session, only on the owner's computers** (`git config user.name` is `gvtenberg`; anyone else skips it, see `CONTRIBUTING.md`): `diff -q ~/.claude/CLAUDE.md docs/claude-regras/CLAUDE.md; diff -rq ~/.claude/regras docs/claude-regras/regras` (the user's general rules, identical on every computer). If they differ or the computer files are missing, follow "Same rules on every computer" in `programacao.md`.
- At the start **do not read** `docs/` or `TESTES-PENDENTES.md`. Read only what the task needs, only the needed part, and do not re-read what was already read in the session.
- Files with several sections have the "**Sections**" index on line 3: read the first 5 lines and search for the title. `docs/historico.md`: search for the version. `TESTES-PENDENTES.md`: `### T12`, never the whole file. To resume work: only "Status" in `docs/melhorias-futuras.md`.
- Where things are: `docs/README.md` (index). File map: `grep -rn "name" docs/arquitetura/`. Rules: `docs/regras/LEIA-ME.md`.

## Documentation (so another person or machine can continue)

- All `.md` files go into git (except what is in `ferramentas-de-teste/`). When changing code or a rule, update the right `.md` in the same commit (architecture, rules, history, tests, spec, Status).
- Done: `docs/historico.md` and `docs/specs/feitas/`. Pending: "Status" section of `docs/melhorias-futuras.md` (update at the end of each stage or round), `docs/specs/` and `TESTES-PENDENTES.md`. Do not create another file that repeats this.
- One subject per file, small (up to ~1,500 words; split when it grows); `##` titles that work as search terms; "**Sections**" index on line 3 when there are several sections; never repeat what is in another file (point to it).

## How we work (small specs)

1. **Plan** (`/planejar <improvement>`): interview the user and create `docs/specs/<name>.md` from `_modelo.md`, with small stages (each fits in one conversation).
2. **Decisions:** a choice that changes a rule, a screen, data read or written (spreadsheet, SEI) or that is hard to undo goes to "Decisions to confirm" with `[ ]`; **do not code** with a `[ ]` that affects the stage and never decide alone.
   - Every doubt is asked **in the chat as soon as it appears** (never left only in the spec nor waiting for the stage where it is used); the answer goes into the spec.
   - With alternatives, ask through the **choice window** (up to 4 questions at a time; the suggestion first; each question self-explanatory). Plain text only when there are no options.
3. **Execute** (`/etapa <spec> <n>`): read only the spec and what it points to. When done: tests, version, history, Status, commit and stage checked.
4. **End of the improvement:** rules to `docs/regras/`, the line leaves `melhorias-futuras.md`/`ideias.md`, spec to `docs/specs/feitas/`.
- Small fixes and test fixes do not need a spec.
- **Several specs at the same time:** the user opens one chat per spec, each in its own worktree; do not start background agents for this.
- **Manual tests** (`/testes`): the user answers on the GitHub cards.

## Who the user is

- Head of CGOC (Budget Management and Contracts Coordination), **not from IT**: plain language, no jargon; commands with the exact text to type and the click path in the browser.
- Ask when in doubt and give suggestions. Often sends several requests in one message.
- Big change, hard to undo, or that writes to an official system (SEI, spreadsheet): proposal + confirmation first.
- New permanent instruction: propose adding it here (in the right place), not only in the automatic memory.
- New ideas: one line in `docs/ideias.md`. New rules: in the right file of `docs/regras/`.
- README.md: the user manual for colleagues, in Portuguese. Update it when a feature, setting or install step changes; the contact text also appears on the settings page (same wording).
- **When the user leaves** and asks you to continue: do what is already decided (specs without `[ ]`), plan the rest and bring the questions in blocks at the end, with suggestions.

## Reply after changing code

- **What changed** (short) · **What I tested** (one line) · **Tests**: only number and title, one per line ("T11 – Instalar pelo GitHub"); the step-by-step stays only in `TESTES-PENDENTES.md`. A **critical** test goes in full in the reply.
- **Test locally first:** every reply after changing code ends with how to test before the merge: the exact `cd` to the worktree folder, `npm run rodar-sei` (VS Code menu **Terminal > New Terminal**; already open: F5 on the page) and a clickable link to the first new test in `TESTES-PENDENTES.md` (line of `### Tnnn`, found with `grep -n`).
- Do not list the changed files. Give the pull request link and say whether the merge makes Mozilla sign; end with suggestions (general rules).
- **Long conversation:** leave everything committed and noted and recommend `/clear` (general rules).

## Tests

- Format, cards and repeated numbers: `docs/testes.md` (read before writing or reading manual tests).
- `TESTES-PENDENTES.md` (Portuguese) is the source of the GitHub cards, created when master receives the file (merge). New number at the end, never reused; never delete a test without "Passou" on the card (or the user's request). An uncommented test = it worked.
- Automated tests at every stage; the user tests the whole improvement at the end. Only stop earlier for a **critical** test (writes to an official system – SEI, spreadsheet – or decides the direction of the next stage), marked "(Crítico)".
- Minimum check: `npm test` and `npm run conferir`. **Never test with screenshots** (nor open the browser to see the screen) without the user's explicit request.

## Version and git

- Not the owner (`git config user.name` is not `gvtenberg`, e.g. the fork `dcarvalho89/extensao-ifto`): read `CONTRIBUTING.md` first; never sync or change `docs/claude-regras/`.
- **Version number (same rule for everyone: owner and colleagues), format `0.MIDDLE.LAST`:**
  - The next number after the last one in **master's** `docs/historico.md`; never skip, never reuse. Only `manifest.json` holds it, plus one or two lines in `docs/historico.md` with the date (dd/mm/yyyy).
  - **Middle +1** (last back to 0) only at the **first stage of a new improvement** (a new spec, or an old spec resumed with new features: one middle number per spec, 18/11/2026). Its other stages, fixes and small changes: **last +1**. Example: master at 0.21.1 → new improvement 0.22.0 → its stage 2 0.22.1 → a fix 0.22.2.
  - Changes not merged into master yet share the open number (same line in `historico.md`); after the merge, a new number, otherwise Mozilla does not sign and the extension does not update. Each version is signed only once by Mozilla.
  - **Pull request from a fork:** one number for the whole pull request (stages inside the fork do not bump), taken only when updating the fork with master (`CONTRIBUTING.md`). The pull request check refuses any other number.
- **Never commit on `master`** nor push to it (25/11/2026, user): branch + pull request, flow in `programacao.md`, "Pull requests" (its `main` is `master` here). **A merge with a new version makes Mozilla sign and update everybody's extension:** say so when asking for the merge; the user tests before it with `npm run rodar-sei`.
- **One round = one pull request = one version = one signing** (26/11/2026, user): Mozilla takes long to sign and more changes always follow, so the work of a round (stages, test fixes, small changes) piles up on one branch `rodada/vX.Y.Z` with **one version number** (middle +1 if the round has a new improvement, else last +1). Pull requests already open are merged into it (their versions and test numbers renumbered) and closed pointing to it. Only the end of the round goes to master, after the user tests with `npm run rodar-sei`. An urgent fix may go alone.
- **No version, no signing:** what does not go into the extension: docs (`.md`, `docs/`, `.claude/`), `.github/`, `testes/`, `package.json` and `package-lock.json` (commit "docs: …", "ci: …", "test: …" or "chore: …").
- **Always commit after the changes** (25/11/2026, user; wins over "Batch changes" in the general rules): every finished change is committed on its branch in the same reply, with its docs and tests, without waiting for the user to test. Also commit pending changes before each stage or round.
- Commit format **"vX.Y.Z: type: short summary"** (e.g. "v0.1.3: feat: procurar atualização na janela"); types in `programacao.md`. Check in `git status` that nothing from `ferramentas-de-teste/`, keys or `.xpi` got in.

## Commands

- `npm test` (rules; create a test for each new rule in `comum/`) · `npm run conferir` (Mozilla check; end of each stage) · `npm run rodar-sei` (test Firefox on the SEI; the user's way to test before the merge) · `npm run empacotar` · `npm run empacotar-chrome` · `npm run rodar`. Details and temporary install: `docs/comandos.md`.
- GitHub: `assinar.yml` checks each pull request; on master, a new `manifest.json` version is signed by Mozilla and published in Releases (`docs/publicacao.md`). Dependabot: monthly pull requests, never merged by themselves; run the tests first (they do not sign).
- `ferramentas-de-teste/` is in `.gitignore`: **never goes into git**; every local test or reference file (saved SEI pages, SEI++ packages) lives there. Never remove lines from `.gitignore` without permission (adding is fine, with notice).
- Keys and passwords (Google, Mozilla) never go into git: they live in `.env.local`, in GitHub secrets or in the browser settings.

## How it works (decided)

- **With login** (Google account @ifto.edu.br) the extension reads the system's Google Spreadsheet. **Without login**, only the SEI improvements. **No costs:** no paid services.
- **IFTO SEI:** every feature must work on the version used at IFTO (currently SEI 5.0.4; see `docs/regras/sei.md`). The extension acts only on `sei.ifto.edu.br`.
- **Installation:** Firefox signed by Mozilla "unlisted" (free), automatic update; Chrome: free package in developer mode, no automatic update.

## Conventions

- Plain JavaScript, no build step, Manifest V3. Pure rules (no page) in `comum/`, working in the browser and in Node (`module.exports` or `globalThis.ExtensaoIFTO`); page code in `sites/<site>/`.
- Reuse functions and shared files (`comum/`, e.g. `comum/sei.js`): see `programacao.md`.
- Short comments in Portuguese explaining **why**, with the version when it is a new rule (`// v0.2.0: ...`).
- Extension texts in plain Portuguese, no unexplained acronyms, **written for the people who use the extension, not for the programmer** (v0.4.1): no GitHub, Actions, code, push, signed version, file names or technical terms; what is for the programmer goes in `docs/` (rule in `docs/padrao-visual.md`).
- Values in the same format as the system ("R$ 1.234,56"); budget types are **never** added together.
- Never write anything to an official system (SEI, spreadsheet, SIAFI…) without the user seeing and confirming first. Exception decided on 12/11/2026: "Assinar e próximo" — the user's click is the confirmation for that document (`docs/regras/lista-assinaturas.md`). Exception decided on 23/11/2026: process assignment when adding to the director's list, if turned on (`docs/regras/lista-direcao.md`).
