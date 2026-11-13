# Instructions for all projects

**Sections**: Language · Economical reading (tokens) · Project and documentation organization · How we work (small specs) · Chat messages (short) · Tests · Version and git · Reusing code · Improvements that serve several projects · Same rules on every computer

Updated on 13/11/2026 (1). Model: `/home/berg/Desktop/Sistema Gestão Orçamentária/sistema-orcamento-ifto` (CLAUDE.md, docs/, .claude/). New project or one without this organization: propose applying it. The user is not from IT: plain, simple language, commands with the exact text to type and the click path.

## Language

- (12/11/2026) **Chat replies, choice-window questions and `.md` docs in English** (saves tokens), in plain English. When a project's docs are still in Portuguese, translate each file when it is next edited (or all at once if the user asks).
- **Stay in Portuguese:** what the system or extension shows to its users, the manual test file (source of the GitHub cards, read by non-IT colleagues), `README.md`, code comments and identifiers.

## Economical reading (tokens)

- At the start **do not read** `docs/` or `TESTES-PENDENTES.md`. Read only what the task needs, only the needed part; do not re-read what was already read in the session.
- Files with several sections have the "**Sections**" index on line 3: read the first 5 lines and search for the title. History: search for the version. Tests: search for `### Tnn` or the mark; never the whole file. To resume work: only the "Status" section of `docs/melhorias-futuras.md`.
- Large reference files (saved pages, spreadsheets): search the excerpt with `grep`, do not read them whole.

## Project and documentation organization

- Short `CLAUDE.md`, with sections: Language · Economical reading · Documentation · How we work · Who the user is · Reply after changing code · Tests · Version and git · Commands · Conventions.
- `docs/`: `arquitetura.md` (file map) · `regras/` (one file per subject + `LEIA-ME.md`) · `padrao-visual.md` · `melhorias-futuras.md` ("Status" section at the top: done, in progress, pending from the user, planned **[spec]**, not planned; then the ideas, one line each) · `specs/` (`_modelo.md`, one spec per improvement; finished ones in `specs/feitas/`) · `historico.md` (one or two lines per version, with date) · `referencias/`. At the root: `TESTES-PENDENTES.md`.
- All `.md` files in git (except local or unnecessary ones), so another person or machine can continue. When changing code or a rule, update the right `.md` and the "Status" in the same commit. Do not create a file that repeats what is already in another (point to it).
- One subject per file; `##` titles that work as search terms; "**Sections**" index on line 3 (update when creating or renaming a section); short texts.
- Texts shown to people who use the system or the extension: written for that user (not from IT), never for the programmer (no GitHub, Actions, code, file names or technical terms); what is for the programmer goes in `docs/`.
- `ferramentas-de-teste/` in `.gitignore` (local test and reference files); keys and passwords never in git (`.env.local`, GitHub secrets). Never remove lines from `.gitignore` without permission.
- `.claude/commands/`: `/planejar`, `/etapa`, `/testes`. `.claude/settings.json`: allows the check commands and `git status/diff/log`; blocks reading `.env.local`.
- GitHub Actions: checks the project on every push; fixed OS version (e.g. `ubuntu-24.04`), `timeout-minutes`, step names in Portuguese.
- (12/11/2026) Workflows that check, build or publish **do not run when the push only changes text files**: `paths-ignore: ['**.md', 'docs/**', 'LICENSE', '.claude/**']` on `push` and `pull_request` (a push with any program file still runs everything). The test-cards workflow is the exception (it runs exactly on `TESTES-PENDENTES.md`).

## How we work (small specs)

1. **Plan** (`/planejar`): interview the user and create the spec with small stages (each fits in one conversation).
2. **Decisions:** a choice that changes a rule, screen or data, or is hard to undo, goes to "Decisions to confirm" with `[ ]`; do not code with a `[ ]` that affects the stage; never decide alone. Every doubt is asked **in the chat as soon as it appears**, through the **choice window** (up to 4 questions, suggestion first, each question self-explanatory); the answer goes into the spec.
3. **Execute** (`/etapa`): read only the spec and what it points to; when finished: tests, version, history, Status, commit, stage checked.
4. **End of the improvement:** rules to `docs/regras/`, the line leaves `melhorias-futuras.md`, spec to `specs/feitas/`. Small fixes do not need a spec.
- New ideas: one line in `melhorias-futuras.md`. New permanent instruction: propose putting it in the project's `CLAUDE.md`.
- **When the user leaves** and asks to continue: do what is already decided, plan the rest and bring the questions in blocks at the end, with suggestions.

## Chat messages (short)

- After changing code: **What changed** (short) · **What I tested** (one line) · **Tests**: only number and title, one per line (step by step only in `TESTES-PENDENTES.md`; a **critical** test goes in full). Do not list the changed files. Say which commits were made and that they were not pushed to GitHub.
- **Long conversation:** when the conversation is large (several rounds or stages, many files read, or after the context was summarized automatically), end with: "⚠️ The conversation is long: I recommend starting a new one. Type `/clear` (everything is already in git and in the docs)." Before that, leave everything committed and noted.

## Tests

- Manual tests via GitHub: the user answers on the **cards** (issues) with the "✅ Passou" / "❌ Falhou" boxes and comments; an Action creates one card per new test and closes those that leave the file; `/testes` reads the cards with a summary script and deletes the resolved ones with a script. Model: `extensao-ifto` (`.github/workflows/testes.yml`, `.github/scripts/`). In an existing project, set it up only when the user asks.
- `TESTES-PENDENTES.md` is **only** the source of the cards (the user does not read it), in Portuguese: compact, no instructions or result lines. Format: "## seção", "> antes de testar" (optional), "### Tnn – título (vX.Y.Z)", "F: o que fazer", "E: o que deve acontecer" (one line each; summarized, only what the user and non-IT colleagues need: where to click and what should appear). The card carries a short "Como responder" footer (a comment counts as an answer for those who cannot click); question: "### Pn – título" and "?: pergunta". Project without cards yet: old detailed format.
- An uncommented test = it worked. Never delete a test without "Passou" on the card (or `[x]` in the old format); only append at the end; new number, never reused.
- Several stages: the user tests everything together at the end; only stop earlier for a **critical** test (writes to an official system or decides the direction), marked "(Crítico)". Automated tests at every stage.
- **Never test with screenshots** without an explicit request.

## Version and git

- On every code change: bump the version and record it in `historico.md` with the date (dd/mm/yyyy).
- (13/11/2026) **Which number:** the **middle** one only for a big change (a new feature or a big change in how the system works); all stages of the same feature keep the middle number. The **last** one for everything else: each stage of the same feature, fixes and small changes (e.g. 0.10.0, 0.10.1, 0.10.2…). **Docs only** (`.md`, `docs/`, the tests file): the version does not change; commit "docs: summary".
- Commit without being asked (before and at the end of each stage or round), in the format **"vX.Y.Z: type: short summary"** (no version: "docs: summary"). Types: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`, `test`, `ci`. Check in `git status` that nothing from tests, keys or packages got in.
- **Never `git push`** without being asked.

## Reusing code

- Before writing a new function, look for one that already does it; a rule used by two features goes to a shared file instead of being copied (less code, lighter program).

## Improvements that serve several projects

- Any improvement (rule, organization, token economy, way of working) that may apply to more than one project: **ask first** (choice window, showing the text) and, on "yes", save it in the local memory and in this file.

## Same rules on every computer

- This file (`~/.claude/CLAUDE.md`) is the general memory, valid for every project on the computer. Each project's memory (`~/.claude/projects/…/memory/`) keeps only what belongs to that project.
- Copy in git: `docs/claude-regras-gerais.md` in each of the user's repositories (today: extensao-ifto and sistema-orcamento-ifto). At the start of the session, run `diff -q ~/.claude/CLAUDE.md docs/claude-regras-gerais.md` (do not read the files). If they differ or the local one is missing, compare only the "Updated on" line and the differences (`diff`) and ask the user (choice window) which one wins: the repository's (copy to the computer), the computer's (copy to the repository and commit) or merge both.
- When changing this file: update the date in "Updated on", copy it to `docs/claude-regras-gerais.md` and commit ("docs: regras gerais do Claude").
