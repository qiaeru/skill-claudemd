---
type: regex
pattern: '\b(IMPORTANT|NEVER|ALWAYS|YOU MUST)\b'
match: not_contains
target: { source: file, path: CLAUDE.md }
---
