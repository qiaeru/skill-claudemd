---
type: regex
pattern: '(^|[^`])@docs/release\.md'
flags: m
match: not_contains
target: { source: file, path: CLAUDE.md }
---
