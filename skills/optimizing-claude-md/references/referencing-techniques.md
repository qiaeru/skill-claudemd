# Referencing instead of duplicating

The point of optimizing CLAUDE.md is to stop copying things that already live elsewhere. But the five ways to "reference" something do not all behave the same way at load time. Picking the wrong one either wastes the tokens you were trying to save or hides a rule you needed.

## What loads when

| Mechanism | Loaded at session start? | Token cost at launch | Use for |
| --- | --- | --- | --- |
| Prose pointer | No | One line (the pointer) | Large or only-sometimes-relevant docs |
| `@path` import | Yes, in full | The whole file | Small files needed every session |
| Path-scoped rule | Only when Claude reads a matching file | Zero until then | Conventions tied to one file type or pattern |
| Nested CLAUDE.md | Only when Claude reads files in that directory | Zero until then | Conventions covering one whole subtree |
| Skill | Body only when relevant or invoked | Its description line | Repeatable multi-step workflows |

Hooks belong in the same decision but are not a referencing mechanism: a hook never enters context at all, it runs as a shell command at a fixed lifecycle event. See the Hook section below.

The single most common mistake is believing `@import` saves context. It does not. An imported file is expanded into the context window at launch exactly as if its contents were pasted into CLAUDE.md. Imports are an organization tool, not a token-reduction tool.

## Prose pointer (the default)

A prose pointer is just a sentence that names where the information lives:

```markdown
- Architecture overview: `docs/architecture.md`
- API reference: `docs/api/` (read the relevant file when touching an endpoint)
- Release runbook: `docs/release.md`
```

Claude does not load these at startup. It reads the target file with its normal file tools only when the task actually calls for it. That is why a pointer costs one line now instead of the whole document every session. Make the pointer specific enough that Claude knows *when* to follow it ("when touching an endpoint"), not just that the file exists.

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

### The AGENTS.md pattern

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. If the repo already maintains `AGENTS.md` for other tools, do not copy it into CLAUDE.md. Import it, then add any Claude-specific lines below:

```markdown
@AGENTS.md

## Claude Code
- Use plan mode for changes under `src/billing/`.
```

A symlink (`ln -s AGENTS.md CLAUDE.md`) also works when there is nothing Claude-specific to add. On Windows, prefer the `@AGENTS.md` import, since symlinks need Administrator privileges or Developer Mode.

Running `/init` in a repo that already has an `AGENTS.md` reads it and incorporates the relevant parts into the generated CLAUDE.md, along with other tools' configs such as `.cursorrules`.

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

One behavioural difference to know: after `/compact`, the project-root CLAUDE.md is re-read from disk and re-injected automatically, while a nested CLAUDE.md is not; it reloads the next time Claude reads a file in its directory. A rule that must survive long sessions intact is safer at the root.

The reverse direction also matters: CLAUDE.md files in directories *above* the working directory load in full at launch. In a monorepo, an ancestor CLAUDE.md from another team that does not apply is not yours to edit; exclude it locally with the `claudeMdExcludes` setting instead.

## Hook

A hook (configured in `.claude/settings.json`) runs a shell command at a fixed lifecycle event: before a tool call, after an edit, when Claude stops. It never enters context, and it is deterministic where CLAUDE.md is advisory: Claude can overlook an instruction, it cannot skip a hook.

Move a rule out of CLAUDE.md into a hook when it must happen every time with zero exceptions: "run the linter after every edit", "block writes to `migrations/`", "run the test suite before ending the turn". A rule Claude needs to *know* stays prose; a rule that must be *enforced* becomes a hook, and the CLAUDE.md line gets cut.

## Skill

A skill (`.claude/skills/<name>/SKILL.md`) loads on demand, when its `description` matches the task or the user invokes it by name. To be precise about the cost: the description is always in context (that is how Claude finds the skill), the body costs nothing until it loads. Moving a block to a skill therefore costs about the same at launch as leaving a prose pointer.

Move a block out of CLAUDE.md into a skill when it is a repeatable, multi-step procedure rather than a standing fact: a release process, a scaffolding routine, a domain-specific workflow. Standing facts ("we use 2-space indents") stay in CLAUDE.md; procedures ("how to cut a release") become skills. A skill can also carry a `paths:` frontmatter field, like a rule, so a procedure tied to one part of the codebase activates only when matching files are involved.

## Decision tree

1. Must it run at a fixed point every time, with zero exceptions? Make it a **hook** and cut the line.
2. Is it a multi-step procedure? Move it to a **skill**.
3. Is it true of only one file type or pattern? Move it to a **path-scoped rule**.
4. Is it true of one whole directory subtree? Move it to a **nested CLAUDE.md** there.
5. Does it already exist in a doc, and is that doc large or only sometimes needed? Leave a **prose pointer**.
6. Does it already exist in a small file you need every single session? Use an **`@import`**.
7. Otherwise, if it passed the keep test and has no other home, it stays inline in CLAUDE.md.
