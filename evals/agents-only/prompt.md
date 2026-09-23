---
description: 'A repo with only AGENTS.md and a personal line'
tags: [behavior, agents-md]
max_turns: 60
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write, TodoWrite]
expected_outcome: 'AGENTS.md is optimized in place, with no CLAUDE.md created. The personal line leaves AGENTS.md without breaking native AGENTS.md loading: a new CLAUDE.local.md starts with the @AGENTS.md import, or the reply warns about the trap.'
---

Our AGENTS.md has gotten bloated, clean it up. One line in there is just for my machine and shouldn't be shared with the team. Apply the changes directly, no need to wait for my review.
