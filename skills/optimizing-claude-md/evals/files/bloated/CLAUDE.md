# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project overview

This is a Node.js REST API for managing users and teams, built with Express and PostgreSQL. It uses zod for validation, pg for database access, and vitest for tests. The code lives in `src/`, tests in `tests/`, and documentation in `docs/`.

## Dependencies

- express: web framework
- pg: PostgreSQL client
- zod: schema validation
- vitest: test runner
- eslint: linting

## General guidelines

- Write clean code.
- Use meaningful variable names.
- Follow best practices.
- Add tests for new features.
- Handle errors gracefully.
- Keep functions small and focused.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Test: `npm test`
- Single test: `npm test -- <path>`
- Lint: `npm run lint`

## Workflow

- Run the full test suite before every commit: `npm test`.
- IMPORTANT: ALWAYS run `npm run lint:fix` after editing any file. NEVER skip this.

## Testing

- Prefer running single tests for speed; do not run the whole suite, it takes 9 minutes.
- The API tests need a local Redis on port 6379 (`docker compose up redis`).

## Gotchas

- `src/generated/` is produced by `npm run codegen` from `openapi.yaml`; never edit it by hand.
- `DATABASE_URL` must be set even for unit tests, the pool is created at import time.

## API endpoints

@docs/api.md

### POST /v1/users

Creates a user. Body: `{ email: string, name: string, role: "admin" | "member" }`. Returns 201 with the created user, or 409 if the email already exists.

### GET /v1/users/:id

Returns the user, or 404 if not found. Requires the `users:read` scope.

### PATCH /v1/users/:id

Updates name or role. Body is a partial user. Returns 200 with the updated user.

### DELETE /v1/users/:id

Soft-deletes the user. Returns 204.

## Releasing

@docs/release.md

1. Bump the version in package.json following SemVer.
2. Move the Unreleased CHANGELOG entries under a new dated heading.
3. Commit as `chore(release): vX.Y.Z`.
4. Tag the commit: `git tag vX.Y.Z`.
5. Push with tags: `git push --follow-tags`.
6. Open the GitHub release from the tag and paste the CHANGELOG section.

## Code style

- Use 2-space indentation.
- Use ES modules, not CommonJS.
- Components go in PascalCase.
- Follow the ESLint configuration.
