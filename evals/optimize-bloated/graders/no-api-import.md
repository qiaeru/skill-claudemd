---
type: regex
pattern: '(^|[^`])@docs/api\.md'
flags: m
match: not_contains
target: { source: file, path: CLAUDE.md }
---
