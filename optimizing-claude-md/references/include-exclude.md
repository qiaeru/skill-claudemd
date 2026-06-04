# What to keep, what to cut, what to reference

The keep test comes first: "Would removing this cause Claude to make a mistake?" Everything below assumes a line has passed or failed that test. Lines that pass are then sorted into keep-in-place or replace-with-a-reference.

## Keep in CLAUDE.md

These earn their tokens because Claude cannot derive them and needs them in nearly every session.

- **Commands Claude cannot guess.** The actual build, test, lint, and run commands, especially when they are non-standard (a custom Makefile target, a monorepo task runner, a wrapper script). Include the command to run a *single* test, which Claude reaches for constantly.
- **Code style that differs from the language default.** Tabs vs spaces when it is not the ecosystem norm, import style (ES modules vs CommonJS), a banned pattern. Skip anything a formatter already enforces, that is the formatter's job.
- **Repository etiquette.** Branch naming, commit message format, PR conventions, who merges, whether to push straight to main.
- **Architectural decisions specific to this project.** "State lives in the store, never in component local state", "all API calls go through `src/api/client.ts`", "this service is event-sourced". The *decision and its location*, not a tutorial on the pattern.
- **Environment quirks.** Required env vars, a local service that must be running for tests (Redis, a database), a setup step that is easy to miss, a platform-specific gotcha.
- **Non-obvious behaviours and gotchas.** The thing that bites every newcomer: a function that looks pure but writes to disk, a test that is flaky under parallelism, a generated file that must not be edited by hand.

## Cut entirely

These fail the keep test. Removing them changes nothing, because Claude either already knows them or can see them.

- **Anything Claude can learn by reading the code.** Directory listings, "this project uses React", lists of dependencies already in the manifest.
- **Standard language and framework conventions.** "Use meaningful variable names", "follow PEP 8", "components go in PascalCase". Claude knows the ecosystem defaults.
- **Self-evident advice.** "Write clean code", "add tests", "handle errors gracefully", "keep functions small". Noise that dilutes the real rules.
- **Information that changes frequently.** Current version numbers, a sprint's task list, the name of whoever owns a module this month. It goes stale and starts lying.
- **File-by-file narration of the codebase.** A paragraph per file describing what it does. Claude reads the file when it needs it.

## Reference instead of copy

These pass the keep test (Claude does need the information) but fail the copy test (it already exists elsewhere). Replace the copy with a pointer so there is one source of truth and no launch-time token cost.

- **Detailed API or feature documentation.** Point to `docs/` instead of pasting endpoint signatures.
- **Long workflow guides.** A multi-step release or deploy runbook belongs in a doc or a skill; CLAUDE.md names where it is.
- **Contribution rules already in `CONTRIBUTING.md`.** Point to it; do not restate it and let the two drift apart.
- **The README's project overview.** A pointer, or a single `@README.md` import only if it is short and you genuinely want it every session.
- **Schema, config, or generated reference.** Name the file; Claude opens it on demand.

## Borderline cases

- **A command that is in `package.json` scripts.** If the script name is obvious (`npm test`), a one-line reminder is fine and cheap. If the workflow is "run `npm run build:prod` then `npm run deploy:staging`, never the bare `deploy`", that ordering is a non-obvious rule worth keeping.
- **A convention that is partly enforced by tooling.** If the linter catches it, cut it. If the linter does *not* catch it but reviewers always do, keep it.
- **Architecture that is documented in an ADR.** Keep the one-line decision and its consequence in CLAUDE.md if Claude needs it every session; point to the ADR for the reasoning.
- **Something true of only one directory.** Do not keep it in the root CLAUDE.md. Move it to a path-scoped rule or a nested CLAUDE.md so it loads only when Claude works there.

## The recurring trap

The temptation is to make CLAUDE.md a complete description of the project. It is not documentation; it is the set of standing instructions Claude needs in memory at all times. Completeness is the README's job. CLAUDE.md's job is to be short enough that every line still gets read.
