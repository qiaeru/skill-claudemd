---
type: llm
---

The project contains only CLAUDE.md, README.md, Makefile, config.in, scripts/gen-config.sh, src/main.c and tests/Makefile.
PASS if the reply proposes no pointer to a file outside this list.
FAIL if it proposes pointing to a docs/ directory, CONTRIBUTING.md, or any other file that does not exist.
