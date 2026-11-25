# Instructions for all projects

**Sections**: Who the user is · Language · Economical reading · Doubts and git · Theme files · Improvements for several projects

Updated on 25/11/2026. Only what applies to EVERY project is here (this file is loaded in every message). The rest is in the theme files below: read one only when the task needs it.

## Who the user is
Student, not from IT: plain, simple language; commands with the exact text to type and the click path. Commands that need `sudo` (password): never suggest the `!` prefix in the chat (it cannot read the password); tell the user to open the Terminal (Ctrl+Alt+T), paste with Ctrl+Shift+V and type the password. Tokens are scarce: always be economical.

## Language
- Chat replies, choice-window questions and `.md` docs in plain English (saves tokens), unless the project's `CLAUDE.md` says otherwise. Project docs still in Portuguese: translate each file when it is next edited.
- Stay in Portuguese: what the system shows its users, the manual tests file, `README.md`, code comments and identifiers.

## Economical reading
- At the start read only what the project's `CLAUDE.md` says. Then only what the task needs, only the needed part; never re-read in the same session.
- Files with several sections have the "**Sections**" index on line 3: read the first 5 lines and search for the title.
- No subagents unless I ask (exception: code review, see `programacao.md`): search with `grep` yourself (subagents cost a lot; when one is needed it runs on Sonnet, `CLAUDE_CODE_SUBAGENT_MODEL` in `~/.claude/settings.json`).
- Large files (saved pages, spreadsheets, PDFs): search the excerpt (`grep`, scripts); never read them whole.
- Never read base64 images (`data:image…`, e.g. in saved web pages), unless the user explicitly asks; cut them out with a script before reading.
- Short replies, no recap of what the user already knows. Long conversation (many rounds, many files read, or after an automatic summary): leave everything committed and noted and end with "⚠️ The conversation is long: I recommend starting a new one. Type `/clear` (everything is already saved)."

## Doubts and git
- Never assume what can be asked (setup, equipment, network, preferences, decisions): ask in the chat through the choice window (up to 4 questions, suggestion first, each self-explanatory) and wait. Assume only when the user says so or will be away (then do what is decided and bring the questions in a block at the end, with suggestions).
- Do only what was asked. Anything extra (a new script, extension, automatic search, extra setting) needs a question in the choice window first, even if it seems helpful.
- Every change must be reversible (system, settings, files, code): before changing, keep the previous value or a backup and leave an undo path (undo script or exact commands); prefer turning off over deleting.
- Batch changes (every project, forks included): don't update `.md` files, the version or commit after each small step or follow-up fix; leave the changes uncommitted, let the user test, and write/commit once, after the user confirms it works or at the end of the session. One commit per real change: no extra commits like "translate comments" or "move the list" for work not yet pushed (fold them into the change).
- Keys and passwords never in git. Never remove lines from `.gitignore` without permission. Never `git push` without being asked.

## Theme files
Read only when needed (they are NOT loaded automatically):
- `~/.claude/regras/programacao.md`: projects with code (system, site, extension, app): small specs, tests and GitHub cards, version numbers, commits, worktrees, GitHub Actions, reusing code, chat reply after changing code, keeping these rules equal on every computer. **Read it at the start of every programming session** (unless the project's `CLAUDE.md` imports it with `@`). Never in projects without code.
- `~/.claude/regras/organizacao-projeto.md`: how to organize a project (`CLAUDE.md`, `docs/`, `.md` files). Read only when creating or reorganizing a project, or creating a new `.md` file. New project or one without this organization: propose applying it.

## Improvements for several projects
Any improvement (rule, organization, token economy, way of working) that may serve more than one project: ask first (choice window, showing the text); on "yes", save it in the right file above, update "Updated on" and follow "Same rules on every computer" in `programacao.md`.
