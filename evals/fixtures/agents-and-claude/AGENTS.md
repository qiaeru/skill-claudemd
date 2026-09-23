# AGENTS.md

## Commands

- Test: `make test`; one test: `make test T=<name>`.

## Rules

- Money amounts are integers in cents; never use floats for prices.
- `migrations/` files are append-only; add a new migration instead of editing one.
