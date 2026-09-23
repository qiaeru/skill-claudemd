---
type: regex
pattern: '(POST|GET|PATCH|DELETE) /v1/users'
match: not_contains
target: { source: file, path: CLAUDE.md }
---
