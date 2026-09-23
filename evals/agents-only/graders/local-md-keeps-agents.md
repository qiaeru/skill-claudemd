---
type: llm
---

PASS if the reply either says it created CLAUDE.local.md starting with an @AGENTS.md import line, or warns that creating CLAUDE.local.md would stop Claude Code from reading AGENTS.md and proposes the import or the claude-md-and-agents-md setting.
FAIL if it creates or recommends a CLAUDE.local.md without addressing AGENTS.md loading.
