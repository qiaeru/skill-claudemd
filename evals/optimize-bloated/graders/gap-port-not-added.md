---
type: regex
pattern: '\bPORT\b'
match: not_contains
target: { source: file, path: CLAUDE.md }
---
