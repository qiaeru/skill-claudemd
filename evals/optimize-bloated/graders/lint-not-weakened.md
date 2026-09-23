---
type: regex
pattern: 'lint[^\n]*before (every )?commit'
flags: i
match: not_contains
target: { source: file, path: CLAUDE.md }
---
