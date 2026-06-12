---
name: optimizing-claude-md
description: Optimize a project's CLAUDE.md to be short, specific, and free of duplication. Use when asked to optimize, trim, audit, or improve a CLAUDE.md or AGENTS.md. Scans the existing docs and replaces derivable or duplicated content with on-demand references rather than rewriting it in CLAUDE.md.
---

# Optimizing CLAUDE.md

CLAUDE.md is loaded in full at the start of every session, so every line costs tokens for the whole conversation and competes with the user's real instructions. A bloated file does not just waste tokens, it lowers adherence: the important rules get lost in the noise. Optimizing means keeping only what changes Claude's behaviour and cannot be derived from the code, and pointing to everything else instead of copying it.

This skill follows Anthropic's own guidance for memory files and CLAUDE.md. See the [official memory docs](https://code.claude.com/docs/en/memory) and [best practices](https://code.claude.com/docs/en/best-practices).

## When to apply

Apply when the user asks to optimize, trim, audit, shrink, clean up, or improve a CLAUDE.md, or whenever a CLAUDE.md has grown well past 200 lines. The same procedure works on every memory file in the hierarchy:

- Managed policy, organization-wide: a platform-specific path (for example `/Library/Application Support/ClaudeCode/CLAUDE.md` on macOS) or the `claudeMd` key in `managed-settings.json`; usually read-only for the user, flag conflicts instead of editing it
- User, all projects: `~/.claude/CLAUDE.md`
- Project, shared with the team: `./CLAUDE.md` or `./.claude/CLAUDE.md`
- Local, private to one checkout: `./CLAUDE.local.md` (gitignored)
- Rules: `.claude/rules/*.md` (project) and `~/.claude/rules/*.md` (user). A rule without a `paths:` field loads every session, same as CLAUDE.md, so it gets the same treatment.
- `AGENTS.md`: Claude reads `CLAUDE.md`, not `AGENTS.md`. If the repo already uses `AGENTS.md`, do not duplicate it. See the import pattern in [references/referencing-techniques.md](references/referencing-techniques.md).

Auto memory is a separate system: notes Claude writes for itself in `~/.claude/projects/<project>/memory/MEMORY.md`, loaded each session up to 200 lines or 25KB. Do not optimize it with this skill; it has its own size cap and Claude maintains it. It matters here as a routing target: content in CLAUDE.md that reads like a discovered learning (a build command Claude figured out, a debugging insight) belongs to auto memory, not to hand-written instructions.

If no CLAUDE.md exists yet, suggest running `/init` first to generate a starting point from the codebase, then optimize the result with this skill.

## The two tests

Run every block of the file through two questions, in order.

1. **Keep or cut.** "Would removing this line cause Claude to make a mistake?" If not, cut it. This is the single most important filter: self-evident practices, standard language conventions, anything Claude already does correctly without being told, all go.
2. **Copy or reference.** For what survives: "Can Claude derive this by reading the code, or is it already written down in the project's docs?" If yes, replace the copy with a pointer to the source instead of repeating it. This is what saves tokens and prevents the file from contradicting the docs as they drift.

## Procedure

1. **Read every memory file in scope.** Load the target CLAUDE.md and any others in the hierarchy that apply (parent directories, nested CLAUDE.md, `.claude/rules/`). When working interactively, suggest `/memory`: it lists every memory file actually loaded in the session, which confirms the scope. Record the current line count so you can report the reduction.
2. **Inventory the project's documentation.** Scan `README`, `docs/`, `CONTRIBUTING`, package manifests, ADRs, existing skills under `.claude/skills/`, and any rules. Build a short map of what is documented where. This map is what lets you replace duplication with references rather than guesses.
3. **Classify every block** as keep, cut, or reference using the include/exclude table in [references/include-exclude.md](references/include-exclude.md).
4. **Pick a mechanism for each "reference" block.** Default to a prose pointer, because it loads on demand and costs nothing at launch. Reserve `@import`, path-scoped rules, and skills for the cases described in [references/referencing-techniques.md](references/referencing-techniques.md).
5. **Detect contradictions.** Check for instructions that conflict within the file, across nested CLAUDE.md files and rules, or against the docs you are about to point to. Resolve each to a single source of truth; when CLAUDE.md and a doc disagree, keep the correct one and delete the other.
6. **Restructure** the survivors: markdown headers and bullets, concrete and verifiable phrasing ("Use 2-space indentation", not "format properly"). Group related rules.
7. **Relocate misplaced content.** Move multi-step procedures and rules that only matter for one part of the codebase out of CLAUDE.md into a skill, a path-scoped rule, or a nested CLAUDE.md, so they load only when relevant. Turn rules that must run at a fixed point with zero exceptions ("run the linter after every edit", "never write to `migrations/`") into hooks: CLAUDE.md is advisory, hooks are deterministic.
8. **Report.** Show the before and after line count, summarize what was cut, referenced, or moved, and confirm that nothing load-bearing was lost. When the source files are tracked, prefer showing a diff before writing.

## Reference, don't duplicate

This is the core move and the one most often done wrong. There are five mechanisms, and they do not all save tokens.

- **Prose pointer (default).** A plain sentence naming where the information lives: "Architecture overview: `docs/architecture.md`." It is *not* auto-loaded, so it costs only its one line at launch; Claude reads the target on demand when the task needs it. Use this for anything large or only-sometimes-relevant.
- **`@path` import.** `@docs/git-workflow.md` expands the whole file into context at launch, exactly as if you had pasted it. It does **not** save tokens. Reserve it for small files that are needed every session, or to wire up `@AGENTS.md`.
- **Path-scoped rule** (`.claude/rules/*.md` with a `paths:` frontmatter field). Loads only when Claude reads matching files. Use for conventions tied to one file type or pattern.
- **Nested CLAUDE.md.** A CLAUDE.md in a subdirectory loads on demand, when Claude reads files in that directory, not at launch. Use for conventions that cover one whole subtree.
- **Skill.** The body loads on demand when relevant or invoked; only its one-line description sits in context. Use for repeatable multi-step workflows, not for always-on facts.

The decision tree and concrete examples are in [references/referencing-techniques.md](references/referencing-techniques.md).

## Keep or cut, quick reference

| ✅ Keep | ❌ Cut or reference |
| --- | --- |
| Bash commands Claude cannot guess | Anything Claude can learn by reading the code |
| Code style that differs from the language default | Standard conventions Claude already knows |
| Test runner and how to run a single test | Detailed API docs (point to the docs instead) |
| Repo etiquette (branch naming, PR rules) | Information that changes frequently |
| Architectural decisions specific to this project | Long explanations or tutorials |
| Environment quirks (required env vars, setup gotchas) | File-by-file descriptions of the codebase |
| Non-obvious behaviours and common gotchas | Self-evident advice ("write clean code") |

The full table with borderline cases is in [references/include-exclude.md](references/include-exclude.md).

## Sizing and structure

- **Target under 200 lines.** Treat it as a soft ceiling, not a hard cap: never delete a load-bearing rule just to hit a number, but if you are over, you are almost certainly duplicating docs or keeping derivable facts.
- **Structure with headers and bullets.** Claude scans structure the way readers do; grouped sections beat dense paragraphs.
- **Be specific and verifiable.** Prefer "Run `npm test` before committing" over "test your changes".
- **HTML comments are free.** Block-level `<!-- ... -->` comments are stripped before the file enters context, so use them for maintainer notes without spending tokens. Comments inside code blocks are preserved and do count.
- **Emphasis sparingly.** `IMPORTANT` or `YOU MUST` raise adherence for a genuine must-follow rule, but lose their force if every line shouts.

## Don't

- Don't cut a rule just because it is long. Apply the keep test, not a word count. A non-obvious gotcha earns its lines.
- Don't `@import` a large doc to "save space". Imports load in full at launch; use a prose pointer.
- Don't invent or assume documentation. Only point to files that exist, and verify each pointer resolves before writing it.
- Don't move team-shared project rules into `CLAUDE.local.md`; that hides them from the team. Local is for personal, machine-specific notes only.
- Don't leave contradictions standing. If two instructions disagree, Claude picks one arbitrarily; pick for it.

## Final checklist

- Every surviving line passes the keep test.
- No content duplicates the README, docs, or manifests; duplication became a pointer.
- Every pointer resolves to a file that exists.
- No two instructions contradict each other, here or across nested files and rules.
- Multi-step or path-specific content moved to a skill, a path-scoped rule, or a nested CLAUDE.md; must-always-run rules became hooks.
- No content duplicates what auto memory already records on its own.
- File is under 200 lines, structured with headers and bullets, phrased concretely.
- Reported the before and after line count and the substantive changes.

## Examples

See [references/examples.md](references/examples.md) for before and after optimizations: duplication turned into pointers, a contradiction resolved, a multi-step block moved out to a skill, and a zero-exception rule turned into a hook.
