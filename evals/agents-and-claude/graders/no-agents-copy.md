---
type: regex
pattern: 'make test|append-only'
match: not_contains
target: { source: file, path: CLAUDE.md }
---
