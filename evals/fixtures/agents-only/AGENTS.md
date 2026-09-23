# AGENTS.md

Instructions for AI coding agents working on this repository.

## Overview

`csvkit-lite` is a small Node.js CLI that converts CSV files to JSON. The entry point is `src/cli.js`, the delimiter sniffing is in `src/detect.js`, and the tests live in `tests/`. It has no runtime dependencies.

## Guidelines

- Write clean, readable code.
- Follow best practices.
- Add tests for new features.
- Use descriptive variable names.

## Commands

- Test: `npm test`
- One test: `node --test tests/<name>.test.js`
- Release build: `npm run bundle` (writes `dist/cli.cjs`; never edit `dist/` by hand)

## Gotchas

- Input files may use `;` as the delimiter (European exports); `src/detect.js` sniffs it, so never hardcode `,`.
- Note to self: my sample CSVs are in `D:\data\csv-samples`, use them for manual runs.
