Execute the given stage(s): $ARGUMENTS (spec name in `docs/specs/` and stage number; can be a range, e.g. `base-e-sei 2-3`).

1. Read the spec. If any decision in "Decisions to confirm" that affects these stages is still `[ ]`, **stop** and ask me in the chat (choice window); do not decide alone. A new doubt that comes up during the stage (even if it only affects future stages): ask in the chat right away and record the answer in the spec.
2. If there are pending changes in git, commit them before starting ("vX.Y.Z: type: summary"; types in CLAUDE.md).
3. Read only the code files and the `docs/regras/` files the stage needs (and, if it uses system data, only the needed part of `../sistema-orcamento-ifto/docs/`). Saved SEI pages: `ferramentas-de-teste/paginas-sei/` (search the excerpt with `grep`, do not read the whole page).
4. Code the stage. Create automated rule tests when there is a new rule. Run `npm test` and, at the end of the stage, `npm run conferir`.
5. Bump the version in `manifest.json` (first stage of an improvement: middle number if it is a big change; next stages of the same improvement: only the last number), record it in `docs/historico.md` (with today's date), check the stage as done in the spec, update the "Status" section of `docs/melhorias-futuras.md` and append the manual tests at the end of `TESTES-PENDENTES.md` (compact format from CLAUDE.md, in Portuguese). Commit the stage (no push).
6. If I asked for a range, go on to the next stage without asking me for tests; only stop before the end for a critical test or a doubt only I can resolve.
7. If it is the spec's last stage: move the spec's rules to `docs/regras/`, remove the line from `docs/melhorias-futuras.md`, move the spec to `docs/specs/feitas/` and commit.
8. Reply in the CLAUDE.md format (tests only with number and title, grouped by stage).
