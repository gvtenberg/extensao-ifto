Let's plan the improvement: $ARGUMENTS

Do not code anything in this conversation.

1. Search `docs/melhorias-futuras.md` and `docs/specs/` for only the part about this improvement (use search, do not read the whole files). Read in `docs/regras/` only the file on the subject, if needed. If the improvement uses system data, read only the needed part of `../sistema-orcamento-ifto/docs/planilha.md` and `../sistema-orcamento-ifto/docs/regras/`.
2. Interview me to find the real goal and the details: at most 4 questions at a time, preferably with options and your suggestion. Ask whatever is needed so no important decision is left open (sites and pages, what the extension reads and writes, login, permissions, screens, deadlines, what is left out).
3. When you have enough, create or update `docs/specs/<name>.md` from `docs/specs/_modelo.md`:
   - goal, out of scope, decided rules and what changes;
   - in "Decisions to confirm", everything I have not answered clearly yet, with `[ ]`; **ask these in the chat before finishing** (choice window; do not send me to the file) and record the answers as decisions;
   - small stages, each fitting in one conversation and with a way to test.
4. On the improvement's line in `docs/melhorias-futuras.md`, add the **[spec]** mark and the spec path.
5. Update the "Status" section of `docs/melhorias-futuras.md`. At the end, tell me in a few lines which decisions are still open and commit ("docs: spec <name>", no push).
