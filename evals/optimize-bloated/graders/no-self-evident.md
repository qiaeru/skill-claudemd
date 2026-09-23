---
type: regex
pattern: 'write clean code|meaningful variable names|follow best practices'
flags: i
match: not_contains
target: { source: file, path: CLAUDE.md }
---
