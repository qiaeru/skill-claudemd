---
name: optimizing-claude-md
description: Optimize a project's CLAUDE.md to be short, specific, and free of duplication. Use when asked to optimize, trim, audit, or improve a CLAUDE.md or AGENTS.md. Scans the existing docs and replaces derivable or duplicated content with on-demand references rather than rewriting it in CLAUDE.md.
when_to_use: Also when asked to shrink, slim down, clean up, prune, or review a CLAUDE.md, CLAUDE.local.md, a nested CLAUDE.md, or .claude/rules/, and when /doctor already proposed trims and the user wants a deeper pass.
---

# Optimizing CLAUDE.md

CLAUDE.md is loaded in full at the start of every session, so every line costs tokens for the whole conversation and competes with the user's real instructions. A bloated file wastes context and lowers adherence: the important rules get lost in the noise. Optimizing means keeping only what changes Claude's behavior and cannot be derived from the code, and pointing to everything else instead of copying it.

This skill follows Anthropic's own guidance for memory files and CLAUDE.md. See the [official memory docs](https://code.claude.com/docs/en/memory) and [best practices](https://code.claude.com/docs/en/best-practices).

The bundled `/doctor` skill (Claude Code 2.1.206 and later) makes a first-pass trim of a checked-in CLAUDE.md: it cuts content derivable from the codebase, dedupes `CLAUDE.local.md` against it, and migrates procedures to skills and nested files. This skill is the deeper pass: contradictions, stale commands and paths, the choice between the five referencing mechanisms, and hooks. When working interactively, suggest `/doctor` first, then run this skill on what remains.

## When to apply

Apply when the user asks to optimize, trim, audit, shrink, clean up, or improve a CLAUDE.md, or whenever a CLAUDE.md has grown well past 200 lines. The same procedure works on every memory file in the hierarchy:

- Managed policy, organization-wide: a platform-specific path (for example `/Library/Application Support/ClaudeCode/CLAUDE.md` on macOS, `/etc/claude-code/CLAUDE.md` on Linux) or the `claudeMd` key in `managed-settings.json`; usually read-only for the user, and `claudeMdExcludes` cannot exclude it, so flag conflicts instead of editing it
- User, all projects: `~/.claude/CLAUDE.md`
- Project, shared with the team: `./CLAUDE.md` or `./.claude/CLAUDE.md`; when both exist, both load
- Local, private to one checkout: `./CLAUDE.local.md` (gitignored)
- Rules: `.claude/rules/*.md` (project) and `~/.claude/rules/*.md` (user). A rule without a `paths:` field loads every session, same as CLAUDE.md, so it gets the same treatment.
- `AGENTS.md`: Claude reads `CLAUDE.md`, not `AGENTS.md`. If the repo already uses `AGENTS.md`, do not duplicate it. See the import pattern in [references/referencing-techniques.md](references/referencing-techniques.md).

Auto memory is a separate system: notes Claude writes for itself in `~/.claude/projects/<project>/memory/MEMORY.md`, loaded each session up to 200 lines or 25KB. Do not optimize it with this skill; it has its own size cap and Claude maintains it. It matters here as a routing target: content in CLAUDE.md that reads like a discovered learning (a build command Claude figured out, a debugging insight) belongs to auto memory, not to hand-written instructions.

If no CLAUDE.md exists yet, suggest running `/init` first to generate a starting point from the codebase, then optimize the result with this skill. On an existing CLAUDE.md, `/init` suggests improvements rather than overwriting it.

## The two tests

Run every block of the file through two questions, in order.

1. **Keep or cut.** "Would removing this line cause Claude to make a mistake?" If not, cut it. This is the single most important filter: self-evident practices, standard language conventions, anything Claude already does correctly without being told, all go.
2. **Copy or reference.** For what survives: "Can Claude derive this by reading the code, or is it already written down in the project's docs?" If yes, replace the copy with a pointer to the source instead of repeating it. This is what saves tokens and prevents the file from contradicting the docs as they drift.

## Procedure

1. **Read every memory file in scope.** Load the target CLAUDE.md and any others in the hierarchy that apply (parent directories, nested CLAUDE.md, `.claude/rules/`). When working interactively, suggest `/context`: its **Memory files** list shows what actually loaded in the session, which confirms the scope. Record the line count and the character count so you can report the reduction; lines alone understate a file of long lines.
2. **Inventory the project's documentation.** Scan `README`, `docs/`, `CONTRIBUTING`, package manifests, ADRs, existing skills under `.claude/skills/`, and any rules. Build a short map of what is documented where. This map is what lets you replace duplication with references rather than guesses.
3. **Classify every block** as keep, cut, or reference using the include/exclude table in [references/include-exclude.md](references/include-exclude.md).
4. **Pick a mechanism for each "reference" block.** Default to a prose pointer, because it loads on demand and costs nothing at launch. Reserve `@import`, path-scoped rules, and skills for the cases described in [references/referencing-techniques.md](references/referencing-techniques.md).
5. **Detect contradictions, duplicates, and stale survivors.** Check for instructions that conflict within the file, across nested CLAUDE.md files and rules, or against the docs you are about to point to. Resolve each to a single source of truth; when CLAUDE.md and a doc disagree, keep the correct one and delete the other. Files at the same level (`./CLAUDE.md`, `./.claude/CLAUDE.md`, `CLAUDE.local.md`) are concatenated at launch, so a rule repeated across them is paid twice: keep one copy. Then verify that the content you are keeping is still current: every command you keep still runs, every path or file it names still exists. A stale rule misleads worse than a missing one, so fix it or cut it.
6. **Restructure the survivors, with a minimal diff.** Markdown headers and bullets, concrete and verifiable phrasing ("Use 2-space indentation", not "format properly"), related rules grouped. Leave the wording and order of a line that passed both tests alone; rewrite only what is vague. The diff should show the substantive changes, not a rephrasing of everything.
7. **Relocate misplaced content.** Move multi-step procedures and rules that only matter for one part of the codebase out of CLAUDE.md into a skill, a path-scoped rule, or a nested CLAUDE.md, so they load only when relevant. Turn rules that must run at a fixed point with zero exceptions ("run the linter after every edit", "never write to `migrations/`") into hooks: CLAUDE.md is advisory, hooks are deterministic.
8. **Propose, then write.** Before touching any file, show the classification block by block (kept, cut, pointed to where, moved to what) and the resulting diff. When working interactively, wait for confirmation. Only then write the new CLAUDE.md and create the files it now points to or relies on.
9. **Report.** Show the before and after line and character counts, summarize what was cut, referenced, or moved, and confirm that nothing load-bearing was lost. When working interactively, suggest `/context` before and after: it shows the actual token footprint of the memory files at launch, which is the unit that matters.

## Reference, don't duplicate

This is the core move and the one most often done wrong. There are five mechanisms, and they do not all save tokens.

| Mechanism | Loaded at launch? | Use for |
| --- | --- | --- |
| Prose pointer (default) | No, only its one line | Anything large or only-sometimes-relevant |
| `@path` import | Yes, the whole file | Small stable files needed every session, wiring up `@AGENTS.md` |
| Path-scoped rule | Only when Claude reads a matching file | Conventions tied to one file type or pattern |
| Nested CLAUDE.md | Only when Claude reads files in that directory | Conventions covering one whole subtree |
| Skill | Body on demand, description always | Repeatable multi-step workflows |

The pivotal fact: `@docs/foo.md` expands the whole file into context at launch, exactly as if you had pasted it, so an import does **not** save tokens. A prose pointer ("Architecture overview: `docs/architecture.md`") is *not* auto-loaded; Claude reads the target on demand. The second nuance: a skill's description is always in context, only its body loads on demand, so moving a block to a skill costs about the same at launch as a prose pointer (zero when the skill lives in a subdirectory's own `.claude/skills/`, which loads only when Claude works there).

The decision tree, the load-time table, and concrete examples are in [references/referencing-techniques.md](references/referencing-techniques.md).

## Keep or cut, quick reference

| ✅ Keep | ❌ Cut or reference |
| --- | --- |
| Bash commands Claude cannot guess | Anything Claude can learn by reading the code |
| Code style that differs from the language default | Standard conventions Claude already knows |
| Test runner and how to run a single test | Detailed API docs (point to the docs instead) |
| Repo etiquette (branch naming, PR rules) | Information that changes frequently |
| Architectural decisions specific to this project | Long explanations or tutorials |
| Environment quirks (required env vars, setup gotchas) | File-by-file descriptions of the codebase |
| Non-obvious behaviors and common gotchas | Self-evident advice ("write clean code") |

The full table with borderline cases is in [references/include-exclude.md](references/include-exclude.md).

## Sizing and structure

- **Target under 200 lines.** Treat it as a soft ceiling, not a hard cap: never delete a load-bearing rule just to hit a number, but if you are over, you are almost certainly duplicating docs or keeping derivable facts. The hard cap is 4 MiB: a larger file is skipped entirely.
- **Structure with headers and bullets.** Claude scans structure the way readers do; grouped sections beat dense paragraphs.
- **Be specific and verifiable.** Prefer "Run `npm test` before committing" over "test your changes".
- **HTML comments are free.** Block-level `<!-- ... -->` comments are stripped before the file enters context, so use them for maintainer notes without spending tokens. Comments inside code blocks are preserved and do count.
- **Emphasis sparingly.** `IMPORTANT` or `YOU MUST` raise adherence for a genuine must-follow rule, but lose their force if every line shouts.

## Don't

- Don't cut a rule just because it is long. Apply the keep test, not a word count. A non-obvious gotcha earns its lines.
- Don't rewrite what you keep. A line that passed both tests keeps its wording unless it is vague; churn hides the real changes in the diff.
- Don't `@import` a large doc to "save space". Imports load in full at launch; use a prose pointer, with the path in backticks or without the `@`, since a bare `@path` outside backticks is still an import.
- Don't invent or assume documentation. Only point to files that exist, and verify each pointer resolves before writing it.
- Don't keep in CLAUDE.md what auto memory already records on its own; route discovered learnings there.
- Don't move team-shared project rules into `CLAUDE.local.md`; that hides them from the team. Local is for personal, machine-specific notes only.
- Don't leave contradictions standing. If two instructions disagree, Claude picks one arbitrarily; pick for it.
- Don't write before proposing. Show the block-by-block classification and the diff first.

## Examples

See [references/examples.md](references/examples.md) for before and after optimizations: duplication turned into pointers, a contradiction resolved, a multi-step block moved out to a skill, and a zero-exception rule turned into a hook.
