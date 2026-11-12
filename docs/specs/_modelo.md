# <Improvement name>

**Sections**: 1. Goal · 2. Out of scope · 3. Decisions to confirm · 4. Decided rules · 5. What changes · 6. Stages · 7. Manual tests

- **Status:** draft | waiting for decisions | ready to code | in progress | done
- **Requested on:** dd/mm/yyyy · **Deadline or priority:** …
- **Planned version:** 0.NN.0

## 1. Goal (what for)

One or two sentences: what user problem this solves and how they will know it worked.

## 2. Out of scope

What will **not** be done now (keeps the stage from growing).

## 3. Decisions to confirm

Claude does not code while there is a `[ ]` that affects the stage. The user marks `[x]` and writes the answer, or strikes the question.

- [ ] D1 – Question? Options: (a) … (b) … Claude's suggestion: … because …
  - Answer:

## 4. Decided rules

One line per rule. At the end of the improvement, these lines go to `docs/regras/`.

## 5. What changes

- Sites and pages where the extension acts: …
- Data read or written (system spreadsheet, SEI, others): …
- Extension screens (icon window, settings, what appears on pages): …
- Likely code files: …

## 6. Stages

Each stage fits in a short conversation (`/etapa <spec-name> <n>`) and ends with tests, version and commit.

- [ ] Stage 1 – … (what is ready and how to test)
- [ ] Stage 2 – …

## 7. Manual tests

Each stage's tests go to `TESTES-PENDENTES.md` (numbers T…, in Portuguese).
