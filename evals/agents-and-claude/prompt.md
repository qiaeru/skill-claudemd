---
description: 'A CLAUDE.md that points to AGENTS.md in prose and copies one of its rules'
tags: [behavior, agents-md]
max_turns: 60
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write, TodoWrite]
expected_outcome: 'The prose sentence becomes an @AGENTS.md import at the top of CLAUDE.md, the copied money rule leaves CLAUDE.md, and the plan-mode line stays verbatim.'
---

Audit the CLAUDE.md here and fix whatever is wrong with how it's set up. Apply the changes directly, no need to wait for my review.
