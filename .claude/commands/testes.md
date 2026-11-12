I have updated the tests. $ARGUMENTS

1. Read the GitHub cards: `node .github/scripts/ler-resultados.js` (shows only the marked or commented ones). **Do not read the whole `TESTES-PENDENTES.md`**; if you need a test's text, search `### T12` and read only that block.
2. "passou" (passed): delete it from the file with `node .github/scripts/apagar-testes.js T03 T05` (the script checks the count). A comment with a new suggestion goes to `docs/melhorias-futuras.md`.
3. "falhou" (failed): read the comments, only the needed code and rules, and fix. If the comment asks for a rule or screen change that is not just a fix, ask me first (choice window). Survey test: record the result in `docs/regras/` or `docs/referencias/`.
4. Answered question (P..): record the answer in the spec and delete the block with the script.
5. If there was a fix: bump the last version number in `manifest.json`, record it in `docs/historico.md`, update the "Status" section of `docs/melhorias-futuras.md`, delete the fixed tests and append the new ones at the end of the file, in the compact CLAUDE.md format, in Portuguese (new number; the last one shows with `grep -o '### [TP][0-9]*' TESTES-PENDENTES.md | tail -1`).
6. Commit ("vX.Y.Z: type: summary", e.g. "v0.1.4: fix: …"; no push) and reply in the CLAUDE.md format. Remember that new cards and closing resolved ones only happen after `git push`.
