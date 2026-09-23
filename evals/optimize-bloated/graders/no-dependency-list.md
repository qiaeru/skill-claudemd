---
type: regex
pattern: '\b(express|pg|zod)\b'
flags: i
match: not_contains
target: { source: file, path: CLAUDE.md }
---
