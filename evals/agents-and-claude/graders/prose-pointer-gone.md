---
type: regex
pattern: 'Read AGENTS\.md before starting'
match: not_contains
target: { source: file, path: CLAUDE.md }
---
