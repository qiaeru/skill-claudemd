# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-07-05

### Added

- Continuous validation: a GitHub Actions workflow (pushes, pull requests, weekly) checks the repo invariants with a local script, markdown hygiene with markdownlint-cli2, and the plugin manifests with `plugin validate`; Dependabot keeps the workflow's actions current.
- The bare `@` trap when converting an import into a prose pointer: import parsing only skips backticked spans and code blocks, so the path must lose its `@` or gain backticks for the conversion to save anything.
- `/context` suggested alongside the line-count report to show the actual token footprint of the memory files before and after.
- Two facts from the memory docs: `claudeMdExcludes` cannot exclude a managed policy CLAUDE.md, and `/init` on an existing CLAUDE.md suggests improvements rather than overwriting it.

### Changed

- The `PostToolUse` hook example now reads the edited file path from the tool call JSON on stdin instead of linting the whole tree on every edit.

## [1.2.0] - 2026-06-30

### Added

- Currency check on surviving content: the procedure and final checklist now verify that every command and path the skill keeps still runs or resolves, since a stale rule misleads worse than a missing one.

## [1.1.0] - 2026-06-12

### Added

- Plugin distribution: the repository is now a Claude Code plugin (`claudemd`) and its own marketplace, installable with `/plugin marketplace add qiaeru/skill-claudemd` then `/plugin install claudemd@skill-claudemd`, with updates through `/plugin update`. Manual copy into `.claude/skills/` remains supported.
- Nested CLAUDE.md as a fifth referencing mechanism (loads on demand when Claude reads files in that directory, not at launch).
- Hooks as a relocation target for rules that must run every time without exception, with a fourth worked example converting a shouted lint rule into a `PostToolUse` hook.
- Auto memory awareness: discovered learnings route to Claude-written `MEMORY.md` instead of staying in CLAUDE.md.
- Verification steps: `/memory` to confirm which memory files load, the `InstructionsLoaded` hook to confirm a path-scoped rule fires.
- Memory hierarchy completed: managed policy (file or `claudeMd` settings key), project and user rules; monorepo ancestor files excluded via `claudeMdExcludes` rather than edited.
- Compaction behavior as optimization input: the root CLAUDE.md is re-injected after `/compact`, nested ones reload only on the next read, and compaction-preservation instructions join the keep list.
- The worktree caveat for `CLAUDE.local.md` (gitignored, so per-worktree) with the home-directory import as the fix.
- Skills can carry a `paths:` frontmatter field, so a procedure tied to one part of the codebase activates only on matching files.
- `$schema` and `keywords` fields in `plugin.json` for editor validation and discovery.

### Changed

- The skill folder moved from `optimizing-claude-md/` to `skills/optimizing-claude-md/`, the layout Claude Code expects inside a plugin.
- Details refreshed against the current official docs: HTML comments in code blocks are preserved, Windows symlinks also work with Developer Mode, declined import approvals stay disabled, and `/init` incorporates an existing `AGENTS.md`.
- Path-scoped rules described as triggering when Claude reads a matching file, aligning with the docs' wording.
- The skill mechanism's launch cost corrected from "zero" to "its description line": skill descriptions are always in context, only the body loads on demand, so moving a block to a skill costs about the same at launch as a prose pointer.

## [1.0.0] - 2026-06-04

### Added

- Skill `optimizing-claude-md`: trims a project's CLAUDE.md to what is strictly necessary, following Anthropic's memory and best-practice guidance (keep test, under 200 lines, specific and verifiable phrasing). It scans the project's documentation and replaces derivable or duplicated content with on-demand references rather than rewriting it in CLAUDE.md, saving context tokens and preventing the file from contradicting the docs. Three reference files cover the include/exclude table, the four referencing mechanisms and their load-time costs, and before/after examples.
