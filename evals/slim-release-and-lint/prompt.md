---
description: 'Trim plus release steps moved out and the lint rule turned into a hook'
tags: [behavior]
max_turns: 60
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write, TodoWrite]
expected_outcome: 'The same trim as optimize-bloated, plus the Releasing section moved to a skill or a docs/release.md pointer, and the ALWAYS-run-lint rule replaced by a PostToolUse hook in .claude/settings.json.'
---

hey, the CLAUDE.md here is huge, can you slim it down? the release steps should probably live somewhere else, and I want the lint rule to actually run every time, Claude keeps forgetting it. just apply the changes directly, no need to wait for my review
