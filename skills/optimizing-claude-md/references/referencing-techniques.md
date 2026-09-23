# Referencing instead of duplicating

The point of optimizing CLAUDE.md is to stop copying things that already live elsewhere. But the five ways to "reference" something do not all behave the same way at load time. Picking the wrong one either wastes the tokens you were trying to save or hides a rule you needed.

The load-time table of the five mechanisms and the pivotal import fact are in SKILL.md; this file details each mechanism, then hooks, `AGENTS.md`, and the decision tree.

## Prose pointer (the default)

A prose pointer is just a sentence that names where the information lives:

```markdown
- Architecture overview: `docs/architecture.md`
- API reference: `docs/api/` (read the relevant file when touching an endpoint)
- Release runbook: `docs/release.md`
```

Claude does not load these at startup. It reads the target file with its normal file tools only when the task actually calls for it. That is why a pointer costs one line now instead of the whole document every session. Make the pointer specific enough that Claude knows *when* to follow it ("when touching an endpoint"), not just that the file exists.

Write the path in backticks or plain prose, never with a bare `@` prefix. Import parsing only skips code spans and fenced blocks, so `@docs/foo.md` outside backticks is still an import that loads the whole file at launch. When converting an import into a pointer, dropping the `@` (or wrapping the path in backticks) is the step that actually saves the tokens.

Use a prose pointer for: detailed API docs, long workflow guides, the README overview, schemas, ADRs, anything large, anything needed only occasionally.

## `@path` import

```markdown
See @README.md for the project overview and @package.json for the npm scripts.

# Git workflow
@docs/git-instructions.md
```

Both relative and absolute paths work; relative paths resolve against the file that contains the import, and imports can nest up to four hops deep. The first time a project uses an external import, Claude Code shows an approval dialog; if the user declines, the imports stay disabled and the dialog does not reappear.

Because the whole file enters context at launch, only import when **all** of these hold: the file is small, you need it in every session, and it is stable. A 400-line API doc fails all three, use a pointer. A 15-line list of npm scripts you reference constantly is a reasonable import.

One legitimate import that surprises people: a gitignored `CLAUDE.local.md` exists only in the worktree where it was created, so to share personal instructions across git worktrees, import a file from the home directory instead (`@~/.claude/my-project-instructions.md`).

## Path-scoped rule

A rule under `.claude/rules/` with a `paths:` frontmatter field loads only when Claude works with files matching the glob. This is how you keep a directory-specific convention out of the always-on budget.

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API rules
- Every endpoint validates its input.
- Use the standard error envelope.
```

Move a block out of CLAUDE.md into a path-scoped rule when it is true of only part of the codebase. A rule file with no `paths:` field loads every session, same as CLAUDE.md, so it only helps if you scope it. Rules are discovered recursively under `.claude/rules/`, symlinks resolve (handy for sharing a rule set across projects), and `~/.claude/rules/` holds user-level rules that load before project rules. To verify a scoped rule actually fires, the `InstructionsLoaded` hook logs every instruction file as it loads, and why.

## Nested CLAUDE.md

A CLAUDE.md inside a subdirectory does not load at launch. Claude pulls it in when it reads files in that directory, so it behaves like a path-scoped rule whose scope is the directory tree itself.

Move a block out of the root CLAUDE.md into a nested one when a whole subtree has its own conventions: a `frontend/` app inside a monorepo, a package with its own build commands. Prefer a path-scoped rule when the convention follows a file pattern that crosses directories (`**/*.test.ts`).

One behavioral difference to know: after `/compact`, the project-root CLAUDE.md is re-read from disk and re-injected automatically, while a nested CLAUDE.md is not; it reloads the next time Claude reads a file in its directory. A rule that must survive long sessions intact is safer at the root.

The reverse direction also matters: CLAUDE.md files in directories *above* the working directory load in full at launch. In a monorepo, an ancestor CLAUDE.md from another team that does not apply is not yours to edit; exclude it locally with the `claudeMdExcludes` setting instead.

## Hook

A hook (configured in `.claude/settings.json`) runs a shell command at a fixed lifecycle event: before a tool call, after an edit, when Claude stops. It never enters context, and it is deterministic where CLAUDE.md is advisory: Claude can overlook an instruction, it cannot skip a hook.

Move a rule out of CLAUDE.md into a hook when it must happen every time with zero exceptions: "run the linter after every edit", "block writes to `migrations/`", "run the test suite before ending the turn". A rule Claude needs to *know* stays prose; a rule that must be *enforced* becomes a hook, and the CLAUDE.md line gets cut.

A hook's `if` field takes permission-rule syntax (`"if": "Edit(*.ts)"`), so a hook can be scoped to a file pattern without parsing the tool input, and `once: true` on a skill's frontmatter hook removes it after its first successful run. To confirm that memory files load when you expect, the `InstructionsLoaded` hook fires for every CLAUDE.md and rule with a `load_reason` (`session_start`, `nested_traversal`, `path_glob_match`, `include`, `compact`); it does not fire for an `AGENTS.md` read natively, only for one a CLAUDE.md imports.

## Skill

A skill (`.claude/skills/<name>/SKILL.md`) loads on demand, when its `description` matches the task or the user invokes it by name. To be precise about the cost: the description is always in context (that is how Claude finds the skill), the body costs nothing until it loads. Moving a block to a skill therefore costs about the same at launch as leaving a prose pointer.

Move a block out of CLAUDE.md into a skill when it is a repeatable, multi-step procedure rather than a standing fact: a release process, a scaffolding routine, a domain-specific workflow. Standing facts ("we use 2-space indents") stay in CLAUDE.md; procedures ("how to cut a release") become skills. A skill can also carry a `paths:` frontmatter field, like a rule, so a procedure tied to one part of the codebase activates only when matching files are involved. A skill placed in a subdirectory's own `.claude/skills/` goes further: nothing of it, not even the description, loads until Claude reads or edits a file in that subdirectory, so a package-specific procedure in a monorepo costs zero at launch.

## AGENTS.md

Claude Code 2.1.277 and later reads `AGENTS.md` natively, as a fallback by default: only when no `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` exists in the working directory or above it (`~/.claude/CLAUDE.md`, managed policy, and `.claude/rules/` do not count for that check). Then every `AGENTS.md` and `.claude/AGENTS.md` from the working directory up loads at launch, and a subdirectory's `AGENTS.md` loads when Claude reads a file there. Imports and `claudeMdExcludes` apply inside them; `AGENTS.local.md`, `AGENTS.override.md`, and `.agents/` are never read. A loaded `AGENTS.md` costs the same as a CLAUDE.md, so optimize it with the same procedure, and never copy it into a CLAUDE.md.

The **Project instructions** setting (`/config`, user or managed settings only, ignored in project settings) changes the default: `claude-md-and-agents-md` loads both, `claude-md` ignores `AGENTS.md`. Native reading is off, so only an import works, on versions before 2.1.277, with Amazon Bedrock and other third-party providers, with telemetry disabled, in the first session after an install or upgrade, and when the built-in `agents-md` plugin is disabled.

Check each setup:

- **A CLAUDE.md next to an `AGENTS.md` it does not import.** Under the default setting Claude never sees `AGENTS.md`. Put the import at the top of CLAUDE.md and the Claude-specific lines below it (the import never loads the file twice, whatever the setting):

  ```markdown
  @AGENTS.md

  ## Claude Code
  - Use plan mode for changes under `src/billing/`.
  ```

- **A CLAUDE.md that tells Claude in words to read `AGENTS.md`.** The one case where a prose pointer is wrong: Claude sees the file only if it decides to open it. Replace the sentence with the `@AGENTS.md` import, or delete the CLAUDE.md if it holds nothing else.
- **A CLAUDE.md holding only `@AGENTS.md`, or a `CLAUDE.md` symlink to it.** Harmless, the content loads once. Deletable, unless some sessions cannot read `AGENTS.md` natively (list above). Prefer the import over a symlink: Edit and Write refuse to write through a symlink, and on Windows creating one needs Administrator or Developer Mode while Git checks it out as a plain text file unless `core.symlinks` is on.
- **A `SessionStart` hook that prints `AGENTS.md`.** Now a second copy in context: remove it.
- **A new `CLAUDE.local.md` in a repo with only `AGENTS.md`.** Its existence switches Claude to CLAUDE.md files for that user, dropping `AGENTS.md`. Start it with the `@AGENTS.md` line, or have the user set **Project instructions** to `claude-md-and-agents-md`.

By default `/init` reads Cursor rules (`.cursor/rules/`, `.cursorrules`) and Copilot rules (`.github/copilot-instructions.md`) and folds the relevant parts into the generated CLAUDE.md; it reads `AGENTS.md` too only with `CLAUDE_CODE_NEW_INIT=1` set. `/import` (Claude Code 2.1.213 and later) appends a one-time copy of another agent's instruction files to CLAUDE.md, which duplicates rather than references: prefer the import line above when the other file stays maintained.

## Decision tree

1. Must it run at a fixed point every time, with zero exceptions? Make it a **hook** and cut the line.
2. Is it a multi-step procedure? Move it to a **skill**.
3. Is it true of only one file type or pattern? Move it to a **path-scoped rule**.
4. Is it true of one whole directory subtree? Move it to a **nested CLAUDE.md** there.
5. Does it duplicate an `AGENTS.md` the repo maintains for other tools? Cut the copy and wire the file up as in the **AGENTS.md** section.
6. Does it already exist in a doc, and is that doc large or only sometimes needed? Leave a **prose pointer**.
7. Does it already exist in a small file you need every single session? Use an **`@import`**.
8. Otherwise, if it passed the keep test and has no other home, it stays inline in CLAUDE.md.
