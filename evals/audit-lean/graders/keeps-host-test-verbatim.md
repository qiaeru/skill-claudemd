---
type: regex
pattern: '`make test` runs on the host, not the target; anything touching registers must be behind `\#ifdef HOST_TEST`\.'
target: { source: file, path: CLAUDE.md }
---
