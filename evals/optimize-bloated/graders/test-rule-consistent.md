---
type: llm
focus: { source: file, path: CLAUDE.md }
---

PASS if the file contains at most one instruction about when to run the full test suite, and that instruction does not both require the full suite on every commit and forbid running the whole suite.
FAIL if the file still says both "run the full test suite before every commit" and "do not run the whole suite".
