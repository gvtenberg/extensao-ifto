# Rules for programming projects

**Sections**: How we work (small specs) · Chat reply after changing code · Texts shown to users · Tests · Version and git · Worktrees · GitHub Actions · External systems can be down · Reusing code · Same rules on every computer

Updated on 18/11/2026. Read at the start of every programming session (see `~/.claude/CLAUDE.md`). Model project: `/home/berg/Desktop/Sistema Gestão Orçamentária/sistema-orcamento-ifto`.

## How we work (small specs)
1. **Plan** (`/planejar`): interview the user and create the spec with small stages (each fits in one conversation).
2. **Knock-on effects** (18/11/2026): before proposing or coding a change, list what it affects elsewhere (later steps, failures, other units, documents already there, other features) and bring it as questions with suggestions, without waiting for the user to notice. **Always include new access** (a new site, permission or personal data read): by the LGPD (Brazil's data protection law) the person must be told and must choose, so it is off by default, asked only when the person turns it on, and the screen explains in plain words what is accessed, what is not, what is gained by allowing it and what is lost by refusing it.
3. **Decisions:** a choice that changes a rule, screen or data, or is hard to undo, goes to "Decisions to confirm" with `[ ]`; do not code with a `[ ]` that affects the stage; never decide alone. Ask each doubt as soon as it appears, **also while coding a stage** (choice window; stop and wait, unless the user said they will be away); the answer goes into the spec.
4. **Execute** (`/etapa`): read only the spec and what it points to; when finished: tests, version, history, Status, commit, stage checked.
5. **End of the improvement:** rules to `docs/regras/`, the line leaves `melhorias-futuras.md`, spec to `specs/feitas/`. Small fixes do not need a spec.
- At the start do not read `docs/` or `TESTES-PENDENTES.md`. To resume work: only the "Status" section of `docs/melhorias-futuras.md`. History: search for the version. Tests: search for `### Tnn`, never the whole file.
- New ideas: one line in `melhorias-futuras.md`. New permanent instruction: propose putting it in the project's `CLAUDE.md`.

## Chat reply after changing code
**What changed** (short) · **What I tested** (one line) · **Tests**: only number and title, one per line (step by step only in `TESTES-PENDENTES.md`; a **critical** test goes in full). Do not list the changed files. Say which commits were made and that they were not pushed.

## Texts shown to users
Texts shown to people who use the system or the extension are written for them (not from IT), never for the programmer (no GitHub, Actions, code, file names or technical terms); what is for the programmer goes in `docs/`. **Always review them** when touching a screen: short, plain, natural (not AI-sounding), saying exactly what to do and where to click.

## Tests
- Manual tests via GitHub: the user answers on the **cards** (issues) with the "✅ Passou" / "❌ Falhou" boxes and comments; an Action creates one card per new test and closes those that leave the file; `/testes` reads the cards with a summary script and deletes the resolved ones with a script. Model: `extensao-ifto` (`.github/workflows/testes.yml`, `.github/scripts/`). In an existing project, set it up only when the user asks.
- `TESTES-PENDENTES.md` is **only** the source of the cards, in Portuguese, compact: "## seção", "> antes de testar" (optional), "### Tnn – título (vX.Y.Z)", "F: o que fazer", "E: o que deve acontecer" (one line each; where to click and what should appear). Question: "### Pn – título" and "?: pergunta". Project without cards yet: old detailed format.
- Result told in the chat: delete from the file the tests that passed and the repeated or replaced ones (their cards close on the next push); say which were deleted.
- An uncommented test = it worked. Never delete a test without "Passou" (or `[x]` in the old format); only append at the end; new number, never reused.
- Several stages: the user tests everything together at the end; stop earlier only for a **critical** test (writes to an official system or decides the direction), marked "(Crítico)". Automated tests at every stage.
- **Never test with screenshots** without an explicit request.

## Version and git
- **Version number** on every code change, recorded in `historico.md` with the date (dd/mm/yyyy). **Always in sequence:** the next number after the last one in `historico.md`; never skip or reuse; one commit = one number; not tied to the stage number. **Middle** digit only for a big change (new feature; all its stages keep it); **last** digit for everything else.
- **Docs do not change the version nor publish:** a change only in documents (`.md`, `docs/`, the tests file, `.claude/`) or in files that are not published (scripts pasted by hand in Google, test-card scripts) does not bump the version (commit "docs: summary") and its push does not publish.
- **Share until pushed:** while nothing was pushed, small changes of the same round join the open version (same line in `historico.md`); a new last number only for a new stage or after a push.
- Commit without being asked (before and at the end of each stage or round): **"vX.Y.Z: type: short summary"** (no version: "docs: summary"). Types: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`, `test`, `ci`. Check `git status`: nothing from tests, keys or packages. Commit only my own files (`git add <files>`, never `git add -A`).
- When changing code or a rule, update the right `.md` and the "Status" in the same commit.

## Worktrees
Every CODE change (a stage or a fix) is made in its own **git worktree**, created by the project's script (no script: create it the first time, or do it by hand): own folder and branch next to the project; links to `node_modules`, the test files folder and `.env.local`; its own test port. Version and test numbers are taken only when merging into `main` (the next free ones); then tests run and `main` is updated. Planning, docs and tests answered in the chat stay in the main folder, which is where the user tests in the browser.

## GitHub Actions
- Check the project on every push; fixed OS version (e.g. `ubuntu-24.04`), `timeout-minutes`, step names in Portuguese.
- Every workflow that checks, builds or publishes has `paths-ignore` on `push` and `pull_request`, e.g. `['**.md', 'docs/**', 'LICENSE', '.claude/**', 'apps-script/**', '.github/scripts/**', '.github/workflows/testes.yml']`. The test-cards workflow is the exception (runs exactly on the tests file).
- `ferramentas-de-teste/` in `.gitignore`; keys in `.env.local` or GitHub secrets.
- `.claude/commands/`: `/planejar`, `/etapa`, `/testes`. `.claude/settings.json`: allows the check commands and `git status/diff/log`; blocks reading `.env.local`.

## External systems can be down
(18/11/2026) Every call to an outside system (government sites such as SICAF and Simples Nacional, APIs, Google, SEI) must expect it to be down, slow or answering with an error page: a time limit with a plain warning ("o site pode estar fora do ar"), buttons to skip that system and go on with the rest or to cancel at any moment, return to the previous screen keeping what the user chose, close what the program opened, and never leave a screen stuck. Plan and test the "system down" case.

## Reusing code
Before writing a new function, look for one that already does it; a rule used by two features goes to a shared file instead of being copied.

## Same rules on every computer
- `~/.claude/CLAUDE.md` and `~/.claude/regras/` are the general memory of the computer. Each project's memory (`~/.claude/projects/…/memory/`) keeps only what belongs to that project.
- Copy in git, in `docs/claude-regras/` of each of the user's repositories (today: extensao-ifto and sistema-orcamento-ifto): `CLAUDE.md` and `regras/*.md`. At the start of the session run (do not read the files): `diff -q ~/.claude/CLAUDE.md docs/claude-regras/CLAUDE.md; diff -rq ~/.claude/regras docs/claude-regras/regras`. If they differ or the computer files are missing, compare only the "Updated on" lines and the differences and ask the user (choice window) which wins: the repository's (copy to the computer), the computer's (copy to the repository and commit) or merge both.
- **Only the owner syncs** (git user `gvtenberg`). Anyone else working in these repositories (a colleague's fork) does not sync `docs/claude-regras/` with their `~/.claude/` in either direction and never changes it; where their personal rules differ, the repository's copy wins in that project; a rule useful for everyone goes as a suggestion in the pull request text.
- When changing these files: update "Updated on", copy them to `docs/claude-regras/` of each repository and commit ("docs: regras gerais do Claude").
