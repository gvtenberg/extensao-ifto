# Rules for programming projects

**Sections**: How we work (small specs) · Chat reply after changing code · Texts shown to users · Tests · Code review · Version and git · Pull requests · Forks · Worktrees · GitHub Actions · Dependabot · External systems can be down · Reusing code · Engineering principles · Code style · Security · Same rules on every computer

Updated on 25/11/2026. Read at the start of every programming session (see `~/.claude/CLAUDE.md`). Model project: `/home/berg/Desktop/Sistema Gestão Orçamentária/sistema-orcamento-ifto`.

## How we work (small specs)
1. **Plan** (`/planejar`): interview the user and create the spec with small stages (each fits in one conversation).
2. **Knock-on effects** (18/11/2026): before proposing or coding a change, list what it affects elsewhere (later steps, failures, other units, documents already there, other features) and bring it as questions with suggestions, without waiting for the user to notice. **Always include new access** (a new site, permission or personal data read): by the LGPD (Brazil's data protection law) the person must be told and must choose, so it is off by default, asked only when the person turns it on, and the screen explains in plain words what is accessed, what is not, what is gained by allowing it and what is lost by refusing it.
3. **Decisions:** a choice that changes a rule, screen or data, or is hard to undo, goes to "Decisions to confirm" with `[ ]`; do not code with a `[ ]` that affects the stage; never decide alone. Ask each doubt as soon as it appears, **also while coding a stage** (choice window; stop and wait, unless the user said they will be away); the answer goes into the spec.
4. **Execute** (`/etapa`): read only the spec and what it points to; when finished: tests, version, history, Status, commit, stage checked.
5. **End of the improvement:** rules to `docs/regras/`, the line leaves `melhorias-futuras.md`, spec to `specs/feitas/`. Small fixes do not need a spec.
- At the start do not read `docs/` or `TESTES-PENDENTES.md`. To resume work: only the "Status" section of `docs/melhorias-futuras.md`. History: search for the version. Tests: search for `### Tnn`, never the whole file.
- New ideas: one line in `melhorias-futuras.md`. New permanent instruction: propose putting it in the project's `AGENTS.md`.

## Chat reply after changing code
**What changed** (short) · **What I tested** (one line) · **Tests**: only number and title, one per line (step by step only in `TESTES-PENDENTES.md`; a **critical** test goes in full). Do not list the changed files. Give the pull request link and say if the merge publishes. End with suggestions.

## Texts shown to users
Texts shown to people who use the system or the extension are written for them (not from IT), never for the programmer (no GitHub, Actions, code, file names or technical terms); what is for the programmer goes in `docs/`. **Always review them** when touching a screen: short, plain, natural (not AI-sounding), saying exactly what to do and where to click.

## Tests
- Manual tests via GitHub: the user answers on the **cards** (issues) with the "✅ Passou" / "❌ Falhou" boxes and comments; an Action creates one card per new test and closes those that leave the file; `/testes` reads the cards with a summary script and deletes the resolved ones with a script. Model: `extensao-ifto` (`.github/workflows/testes.yml`, `.github/scripts/`). In an existing project, set it up only when the user asks.
- `TESTES-PENDENTES.md` is **only** the source of the cards, in Portuguese, compact: "## seção", "> antes de testar" (optional), "### Tnn – título (vX.Y.Z)", "F: o que fazer", "E: o que deve acontecer" (one line each; where to click and what should appear). Question: "### Pn – título" and "?: pergunta". Project without cards yet: old detailed format.
- Result told in the chat: delete from the file the tests that passed and the repeated or replaced ones (their cards close on the next merge); say which were deleted.
- An uncommented test = it worked. Never delete a test without "Passou" (or `[x]` in the old format); only append at the end; new number, never reused.
- Several stages: the user tests everything together at the end; stop earlier only for a **critical** test (writes to an official system or decides the direction), marked "(Crítico)". Automated tests at every stage.
- **Never test with screenshots** without an explicit request.

## Code review
(25/11/2026) Every code review (security, architecture or simple review) is done by a **new subagent**, never by the agent that wrote the code, so that it is as impartial as possible. This is the user's standing request for that subagent (the exception to "No subagents"); it does not mean reviewing every change (only the risky ones, see Security), only that whenever a review is done it is done this way.
- Always a fresh one, with no memory of the conversation: never a fork (it inherits the context) nor one already used in the programming; a new review, another new subagent.
- Tell it only what to review (files or commits), the type of review, what the change must do and the project's rules; not the programmer's reasoning or defense of the code. It only reads and reports, it does not change the code.
- Bring its findings to the user without softening or leaving any out; if the programming agent disagrees with one, say so and why.
- Also applies to review commands (`/code-review`, `/security-review`): run them inside the new subagent when possible.

## Version and git
- **Version number** on every code change, recorded in `historico.md` with the date (dd/mm/yyyy). **Always in sequence:** the next number after the last one in `historico.md`; never skip or reuse; one commit = one number; not tied to the stage number. **Middle** digit only for a big change (new feature; all its stages keep it); **last** digit for everything else.
- **Docs do not change the version nor publish:** a change only in documents (`.md`, `docs/`, the tests file, `.claude/`) or in files that are not published (scripts pasted by hand in Google, test-card scripts, `.github/` settings and workflows) does not bump the version (commit "docs: summary") and **its merge never causes a new deploy** (25/11/2026, every programming project). A pull request with code and docs together publishes normally.
- **Share until merged:** while nothing went to `main`, small changes of the same round join the open version (same line in `historico.md`); a new last number only for a new stage or after a merge.
- Commit on the branch without being asked (before and at the end of each stage or round): **"vX.Y.Z: type: short summary"** (no version: "docs: summary"). Types: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`, `test`, `ci`. Check `git status`: nothing from tests, keys or packages. Commit only my own files (`git add <files>`, never `git add -A`).
- When changing code or a rule, update the right `.md` and the "Status" in the same commit.

## Pull requests
(25/11/2026) Projects on GitHub, except forks. A project's own flow (its `AGENTS.md` or memory) wins.
1. **Never commit on or push to `main`/`master`**, docs included (written rule; where GitHub allows it, propose protecting the branch). One branch per task (`feat/…`, `fix/…`, `docs/…`). Branch, push and pull request: without asking. Pull request text in Portuguese, plain: what changed, how to test, whether the merge publishes.
2. **Review by Copilot first**, to save Claude for what matters: `gh api -X POST repos/<owner>/<repo>/pulls/<n>/requested_reviewers -f 'reviewers[]=copilot-pull-request-reviewer[bot]'`, then check that the request was really registered (the answer can be a success without it). Fix what makes sense and answer on the pull request what was not followed and why.
3. **Copilot not available** (not enabled, no quota, error or no answer in ~10 minutes): a new Claude subagent reviews, always (see Code review). A risky change (see Security) gets the subagent even when Copilot reviewed.
4. **Squash merge:** when the checks pass and the review is resolved, ask (choice window), saying if it publishes; on "yes", `gh pr merge <n> --squash --delete-branch`, title in the commit format. The user tests before that, in the worktree folder. Never merge with a failed check.
5. Then update the main folder (`git switch main && git pull --ff-only`), never discarding someone's changes.
- **Docs get no review** (25/11/2026, every programming project): a pull request that only changes documents (`.md` files, `docs/`, rules included) skips steps 2 and 3; with any code, script, workflow or setting in it, it is reviewed.
- Several issues or stages in a row: only when asked, one subagent and one worktree each, up to the number the user gives; stop on a doubt, a failed test or a critical test. Never an endless loop.

## Forks
(18/11/2026) At the start of every session in a project, before any work, check if it is a fork: `gh repo view --json isFork,parent` (or a remote named `upstream`). If it is, fetch the original's main branch (`git fetch https://github.com/<parent>.git <branch>`) and count what is missing (`git rev-list --count HEAD..FETCH_HEAD`). If something is missing, say how many changes and ask (choice window) whether to sync now:
- **Sync now (suggested):** `git merge FETCH_HEAD`, then the project's tests. Work starts from the latest version, conflicts stay small and the pull request is accepted; if there are conflicts, they are solved now (keep both sides' text).
- **Not now:** starts faster, but the work is built on old code, conflicts grow, and it must be synced anyway before the pull request.
Uncommitted changes: commit them first (ask). Up to date: say so in one line and go on. Never push without being asked. The project's own sync steps (in its `AGENTS.md`) are followed too.

## Worktrees
Every CODE change (a stage or a fix) is made in its own **git worktree**, created by the project's script (no script: create it the first time, or do it by hand): own folder and branch next to the project; links to `node_modules`, the test files folder and `.env.local`; its own test port. Version and test numbers are taken only right before the merge (the next free ones), on the branch updated with `main`; then the tests run. Planning, docs and tests answered in the chat also go on a branch (own worktree if another agent may be working); the user tests code in the browser from the worktree folder.

## GitHub Actions
- Check the project on every push; fixed OS version (e.g. `ubuntu-24.04`), `timeout-minutes`, step names in Portuguese.
- **No deploy for docs** (25/11/2026): check both ways of publishing. (a) By a workflow: `paths-ignore` below; on `push` also `.github/workflows/**` (the pull request still checks them). (b) The host publishing by itself (Render, Vercel, Netlify…): turn off its automatic deploy and publish by the workflow, or use its own ignored-paths setting. Project without this: propose it.
- Every workflow that checks, builds or publishes has `paths-ignore` on `push` and `pull_request`, e.g. `['**.md', 'docs/**', 'LICENSE', '.claude/**', 'apps-script/**', '.github/scripts/**', '.github/dependabot.yml', …]`, ending with `'.github/workflows/**'` on `push` and `'.github/workflows/testes.yml'` on `pull_request`. The test-cards workflow is the exception (runs exactly on the tests file).
- `ferramentas-de-teste/` in `.gitignore`; keys in `.env.local` or GitHub secrets.
- `.claude/commands/`: `/planejar`, `/etapa`, `/testes`. `.claude/settings.json`: allows the check commands and `git status/diff/log`; blocks reading `.env.local`.

## Dependabot
(25/11/2026) Only for projects that are on GitHub AND have third-party dependencies listed in a file it can read (package.json, requirements.txt, etc.) or use GitHub Actions. Does not apply to projects without code, without dependencies, or to forks (the original project decides).
- Applies and there is no `.github/dependabot.yml`: propose it once (choice window: frequency and what to check); on "no", note it in the project's `AGENTS.md` and do not ask again.
- Suggested: monthly, small and medium updates grouped, major ones separate; never auto-merge.
- Before accepting an update: run the project's tests; say if the merge publishes the system.
- Add `.github/dependabot.yml` to `paths-ignore`.

## External systems can be down
(18/11/2026) Every call to an outside system (government sites such as SICAF and Simples Nacional, APIs, Google, SEI) must expect it to be down, slow or answering with an error page: a time limit with a plain warning ("o site pode estar fora do ar"), buttons to skip that system and go on with the rest or to cancel at any moment, return to the previous screen keeping what the user chose, close what the program opened, and never leave a screen stuck. Plan and test the "system down" case.

## Reusing code
Before writing a new function, look for one that already does it; a rule used by two features goes to a shared file instead of being copied.

## Engineering principles
(25/11/2026) New or touched code only; never rewrite old code just for this. The user is learning: when one of these decides something, explain it in one plain sentence.
- KISS: the simplest solution that works. YAGNI: build only what is needed now. DRY: see Reusing code.
- High cohesion: one purpose per file and function. SOLID where it helps; composition over inheritance.
- Design by contract: validate data where it enters; make clear what a function requires and returns.
- Layers (screen, business rules, data access): screens hold no rules and no direct data access. Small projects: only the layers that make sense.
- File over ~800 lines: propose splitting it when a task touches it.
- Bug fix: first a test that reproduces it.

## Code style
(25/11/2026) New or touched code only.
- No nested ternaries.
- Choosing among 4+ options by an id: map of id to function.
- No `any` in new code; clear names; short functions; return early instead of deep nesting.
- Never swallow errors: plain warning for the person, details for the programmer.

## Security
(25/11/2026)
- Check permission on the server, not only on screen.
- Least access for each key; no keys or personal data in logs or error messages.
- Outside text never goes in as HTML without cleaning.
- New dependency: ask first (why, maintained, known flaws).
- Risky change (login, permission, money, writing data): review by a new subagent before the merge (see Code review).

## Same rules on every computer
- `~/.claude/CLAUDE.md` and `~/.claude/regras/` are the general memory of the computer. Each project's memory (`~/.claude/projects/…/memory/`) keeps only what belongs to that project.
- Copy in git, in `docs/claude-regras/` of each of the user's repositories (today: extensao-ifto and sistema-orcamento-ifto): `CLAUDE.md` and `regras/*.md`. At the start of the session run (do not read the files): `diff -q ~/.claude/CLAUDE.md docs/claude-regras/CLAUDE.md; diff -rq ~/.claude/regras docs/claude-regras/regras`. If they differ or the computer files are missing, compare only the "Updated on" lines and the differences and ask the user (choice window) which wins: the repository's (copy to the computer), the computer's (copy to the repository and commit) or merge both.
- **Only the owner syncs** (git user `gvtenberg`). Anyone else working in these repositories (a colleague's fork) does not sync `docs/claude-regras/` with their `~/.claude/` in either direction and never changes it; where their personal rules differ, the repository's copy wins in that project; a rule useful for everyone goes as a suggestion in the pull request text.
- When changing these files: update "Updated on", copy them to `docs/claude-regras/` of each repository, on a branch with a pull request ("docs: regras gerais do Claude"). Where the project says not to keep the copy (CardVoz), do not copy.
