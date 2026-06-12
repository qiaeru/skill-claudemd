# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Plugin distribution: the repository is now a Claude Code plugin (`claudemd`) and its own marketplace, installable with `/plugin marketplace add qiaeru/skill-claudemd` then `/plugin install claudemd@skill-claudemd`, with updates through `/plugin update`. Manual copy into `.claude/skills/` remains supported.
- Nested CLAUDE.md as a fifth referencing mechanism (loads on demand when Claude reads files in that directory, not at launch).
- Hooks as a relocation target for rules that must run every time without exception, with a fourth worked example converting a shouted lint rule into a `PostToolUse` hook.
- Auto memory awareness: discovered learnings route to Claude-written `MEMORY.md` instead of staying in CLAUDE.md.
- Verification steps: `/memory` to confirm which memory files load, the `InstructionsLoaded` hook to confirm a path-scoped rule fires.
- Memory hierarchy completed: managed policy (file or `claudeMd` settings key), project and user rules; monorepo ancestor files excluded via `claudeMdExcludes` rather than edited.
- Compaction behaviour as optimization input: the root CLAUDE.md is re-injected after `/compact`, nested ones reload only on the next read, and compaction-preservation instructions join the keep list.
- The worktree caveat for `CLAUDE.local.md` (gitignored, so per-worktree) with the home-directory import as the fix.
- Skills can carry a `paths:` frontmatter field, so a procedure tied to one part of the codebase activates only on matching files.

### Changed

- The skill folder moved from `optimizing-claude-md/` to `skills/optimizing-claude-md/`, the layout Claude Code expects inside a plugin.
- Details refreshed against the current official docs: HTML comments in code blocks are preserved, Windows symlinks also work with Developer Mode, declined import approvals stay disabled, and `/init` incorporates an existing `AGENTS.md`.
- Path-scoped rules described as triggering when Claude reads a matching file, aligning with the docs' wording.
- The skill mechanism's launch cost corrected from "zero" to "its description line": skill descriptions are always in context, only the body loads on demand, so moving a block to a skill costs about the same at launch as a prose pointer.

## [1.0.0] - 2026-06-04

### Added

- Skill `optimizing-claude-md`: trims a project's CLAUDE.md to what is strictly necessary, following Anthropic's memory and best-practice guidance (keep test, under 200 lines, specific and verifiable phrasing). It scans the project's documentation and replaces derivable or duplicated content with on-demand references rather than rewriting it in CLAUDE.md, saving context tokens and preventing the file from contradicting the docs. Three reference files cover the include/exclude table, the four referencing mechanisms and their load-time costs, and before/after examples.
