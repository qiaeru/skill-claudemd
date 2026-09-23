---
type: regex
pattern: '(?:.*\n){40}'
match: not_contains
target: { source: file, path: CLAUDE.md }
---
