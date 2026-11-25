---
description: Execute a spec stage
---
Execute the stage(s) $ARGUMENTS (spec in `docs/specs/` + stage number or range, e.g. `base-e-sei 2-3`). Follow AGENTS.md (version, tests, commits, reply). Work on a branch in its own worktree. Do not start subagents (except the code review): search with `grep` yourself.

1. Read only the spec. A `[ ]` decision for these stages, or a new doubt: ask in the choice window and wait; record the answer in the spec.
2. Pending git changes: commit them first.
3. Read only the code and `docs/regras/` parts the stage needs (saved SEI pages: `grep`, never whole).
4. Code it, with tests for new rules; `npm test`, and `npm run conferir` at the end.
5. Version, `historico.md`, stage checked, Status, manual tests at the end of `TESTES-PENDENTES.md`; commit on the branch.
6. Range: go on without asking for tests; stop only for a critical test or a doubt only I can resolve.
7. Last stage: rules to `docs/regras/`, line out of `ideias.md`, spec to `docs/specs/feitas/`; commit, push the branch and open the pull request; ask before the merge.
8. Reply in the AGENTS.md format, tests grouped by stage.
