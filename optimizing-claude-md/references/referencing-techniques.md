# Referencing instead of duplicating

The point of optimizing CLAUDE.md is to stop copying things that already live elsewhere. But the four ways to "reference" something do not all behave the same way at load time. Picking the wrong one either wastes the tokens you were trying to save or hides a rule you needed.

## What loads when

| Mechanism | Loaded at session start? | Token cost at launch | Use for |
| --------- | ------------------------ | -------------------- | ------- |
| Prose pointer | No | One line (the pointer) | Large or only-sometimes-relevant docs |
| `@path` import | Yes, in full | The whole file | Small files needed every session |
| Path-scoped rule | Only when a matching file is touched | Zero until then | Conventions tied to one file type or directory |
| Skill | Only when relevant or invoked | Zero until then | Repeatable multi-step workflows |

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

Both relative and absolute paths work; relative paths resolve against the file that contains the import, and imports can nest up to four hops deep. The first time a project uses an external import, Claude Code shows an approval dialog.

Because the whole file enters context at launch, only import when **all** of these hold: the file is small, you need it in every session, and it is stable. A 400-line API doc fails all three, use a pointer. A 15-line list of npm scripts you reference constantly is a reasonable import.

### The AGENTS.md pattern

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. If the repo already maintains `AGENTS.md` for other tools, do not copy it into CLAUDE.md. Import it, then add any Claude-specific lines below:

```markdown
@AGENTS.md

## Claude Code
- Use plan mode for changes under `src/billing/`.
```

A symlink (`ln -s AGENTS.md CLAUDE.md`) also works when there is nothing Claude-specific to add. On Windows, prefer the `@AGENTS.md` import, since symlinks need elevated privileges.

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

Move a block out of CLAUDE.md into a path-scoped rule when it is true of only part of the codebase. A rule file with no `paths:` field loads every session, same as CLAUDE.md, so it only helps if you scope it.

## Skill

A skill (`.claude/skills/<name>/SKILL.md`) loads on demand, when its `description` matches the task or the user invokes it by name. It costs nothing at launch.

Move a block out of CLAUDE.md into a skill when it is a repeatable, multi-step procedure rather than a standing fact: a release process, a scaffolding routine, a domain-specific workflow. Standing facts ("we use 2-space indents") stay in CLAUDE.md; procedures ("how to cut a release") become skills.

## Decision tree

1. Is it a multi-step procedure? Move it to a **skill**.
2. Is it true of only one file type or directory? Move it to a **path-scoped rule**.
3. Does it already exist in a doc, and is that doc large or only sometimes needed? Leave a **prose pointer**.
4. Does it already exist in a small file you need every single session? Use an **`@import`**.
5. Otherwise, if it passed the keep test and has no other home, it stays inline in CLAUDE.md.
