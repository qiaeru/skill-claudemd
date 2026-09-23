---
type: regex
pattern: 'clean, readable code|best practices|descriptive variable names'
flags: i
match: not_contains
target: { source: file, path: AGENTS.md }
---
