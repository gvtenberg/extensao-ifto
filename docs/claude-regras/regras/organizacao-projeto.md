# How to organize a project

**Sections**: AGENTS.md and CLAUDE.md of the project · docs folder · Writing .md files · Git

Updated on 25/11/2026. Read only when creating or reorganizing a project, or creating a new `.md` file. Model: `/home/berg/Desktop/Sistema Gestão Orçamentária/sistema-orcamento-ifto` (AGENTS.md, docs/, .claude/).

## AGENTS.md and CLAUDE.md of the project
- **Programming project** (25/11/2026): the rules go in `AGENTS.md`, which the other AIs also read, so anyone can collaborate with any tool; `CLAUDE.md` has only the line `@AGENTS.md`. `AGENTS.md` uses paths inside the repository (other people do not have `~/.claude`) and tells the AI to read `docs/claude-regras/regras/programacao.md` at the start of a programming session. Existing project with only `CLAUDE.md`: propose the change (`git mv CLAUDE.md AGENTS.md`).
- **Project without code:** only `CLAUDE.md`, saying "no code: do not read `~/.claude/regras/programacao.md`".
- Short (it is loaded in every message; aim for up to ~1,500 words, details go to `docs/`). Sections: Language · Economical reading · Documentation · How we work · Who the user is · Reply after changing code · Tests · Version and git · Commands · Conventions (drop the ones that do not apply).
- Say exactly what to read at the start (ideally one status file) and where each subject is.

## docs folder
- Programming: `arquitetura.md` (file map) · `regras/` (one file per subject + `LEIA-ME.md`) · `padrao-visual.md` · `melhorias-futuras.md` ("Status" section at the top: done, in progress, pending from the user, planned **[spec]**, not planned; then the ideas, one line each) · `specs/` (`_modelo.md`, one spec per improvement; finished ones in `specs/feitas/`) · `historico.md` (one or two lines per version, with date) · `referencias/`. At the root: `TESTES-PENDENTES.md`.
- Without code: one status file (done, in progress, pending, next steps), one file per subject and a map of the folder's files.

## Writing .md files
- One subject per file; do not repeat in one file what is in another (point to it).
- `##` titles that work as search terms; "**Sections**" index on line 3 (update when creating or renaming a section); short texts.

## Git
All `.md` files in git (except local or unnecessary ones), so another person or computer can continue. Local test and reference files out of git (`.gitignore`).
