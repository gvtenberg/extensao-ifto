# Contributing

**Sections**: Setup · Working on a change · Colleague's fork

Project rules: `AGENTS.md` (they win over your personal rules in this project).

## Setup

1. Install Node.js 22, then `npm ci` in the project folder.
2. `npm test` and `npm run conferir` must pass.
3. `npm run rodar-sei` opens a test Firefox with the extension. Windows: install the "Português Brasil" dictionary add-on once there (the system dictionary path is Linux only).

## Working on a change

1. Branch `feat/…`, `fix/…` or `docs/…`; never commit on `master`.
2. Version and commit format: `AGENTS.md`, "Version and git". Manual tests: `docs/testes.md`.
3. Open a pull request: what changed, how to test, whether the merge makes Mozilla sign. Squash merge after the check "assinar" is green and the review is resolved.

## Colleague's fork

Only if `git config user.name` is not `gvtenberg`, or when dealing with the colleague's pull request (18/11/2026).

A colleague works in the fork `dcarvalho89/extensao-ifto` and sends pull requests to `gvtenberg/extensao-ifto`. If it is not you (`git config user.name` is not `gvtenberg`):
- **General rules:** your personal rules stay in your `~/.claude/`; where they differ, `AGENTS.md` wins in this project. A rule useful for everyone: write it as a suggestion in the pull request text.
- **Before opening or updating a pull request** (and again if GitHub says "This branch has conflicts" or "out-of-date"):
  1. `git fetch https://github.com/gvtenberg/extensao-ifto.git master` and `git merge FETCH_HEAD`.
  2. Own new tests renumbered to after the highest `T`/`P` number ever used in master (see the cards too) and moved to the end of `TESTES-PENDENTES.md`; version: one number for the pull request, the next after master's (rule in `AGENTS.md`, "Version and git").
  3. Conflicts: keep both sides' text, then delete every `<<<<<<<`, `=======` and `>>>>>>>` line (`npm test` fails if one is left).
  4. `npm test` and `npm run conferir` must pass; commit and push to the fork.
- **After pushing:** `gh pr checks <number> --repo gvtenberg/extensao-ifto --watch`. If "assinar" fails: `gh run view <run id> --repo gvtenberg/extensao-ifto --log-failed`, find the "Pull request recusado" lines and explain them to the user in plain words, with the fix (the check `.github/scripts/conferir-pull-request.js` refuses: outdated fork, version out of sequence, reused test number).
- **Owner (gvtenberg):** GitHub blocks the merge until the check is green and the branch is up to date (rule "Merge só com a conferência verde" in Settings > Rules). Do not use "bypass" with a red ✗: ask Claude to fix it.
