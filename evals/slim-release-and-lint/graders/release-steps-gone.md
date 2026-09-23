---
type: regex
pattern: 'git tag vX\.Y\.Z|--follow-tags'
match: not_contains
target: { source: file, path: CLAUDE.md }
---
