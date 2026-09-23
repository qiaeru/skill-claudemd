---
type: regex
pattern: 'CONTRIBUTING|ARCHITECTURE|docs/architecture'
flags: i
match: not_contains
target: { source: file, path: CLAUDE.md }
---
