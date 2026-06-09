# Before and after

Three worked optimizations. Each shows the original block, the problem, and the optimized result.

## 1. Duplication turned into a pointer

A CLAUDE.md that restates the API documentation. Every endpoint signature already lives in `docs/api/`.

**Before** (37 lines, loaded every session):

```markdown
## API endpoints

### POST /v1/users
Creates a user. Body: { email: string, name: string, role: "admin" | "member" }.
Returns 201 with the created user, or 409 if the email already exists.

### GET /v1/users/:id
Returns the user, or 404 if not found. Requires the `users:read` scope.

### PATCH /v1/users/:id
Updates name or role. Body is a partial user. Returns 200 with the updated user.

... (28 more lines of the same)
```

**Problem.** This is a copy of `docs/api/users.md`. It costs ~37 lines every session, and the moment an endpoint changes, the docs and CLAUDE.md disagree, so Claude gets a stale contract.

**After** (1 line, loaded every session; the detail loads on demand):

```markdown
- API contract: `docs/api/` (read the relevant file before changing an endpoint).
```

The full signatures are still available; Claude opens the right file when it touches an endpoint, instead of carrying all of them in context the whole time.

## 2. A contradiction resolved

Two rules in the same file, written months apart, that disagree.

**Before:**

```markdown
## Workflow
- Run the full test suite before every commit: `npm test`.

## Testing
- Prefer running single tests for speed; do not run the whole suite, it takes 9 minutes.
```

**Problem.** One section says always run the full suite, the other says never. Claude picks one arbitrarily, and the user cannot predict which. Contradictions are worse than missing rules.

**After** (one source of truth):

```markdown
## Testing
- Run the single relevant test while iterating: `npm test -- <path>`.
- Run the full suite (`npm test`, ~9 min) once before opening a PR, not on every commit.
```

The conflict is gone, and the surviving rule is more specific than either original.

## 3. A multi-step procedure moved to a skill

A release runbook sitting in CLAUDE.md, loaded every session even though releases happen monthly.

**Before** (in CLAUDE.md, ~20 lines):

```markdown
## Releasing
1. Bump the version in package.json following SemVer.
2. Move [Unreleased] CHANGELOG entries under a new dated heading.
3. Commit as "chore(release): vX.Y.Z".
4. Tag the commit: git tag vX.Y.Z.
5. Push with tags: git push --follow-tags.
6. Open the GitHub release from the tag, paste the CHANGELOG section.
... (steps 7-10)
```

**Problem.** This is a procedure, not a standing fact. It only matters at release time, but it costs its lines in every unrelated session.

**After.** Move it to `.claude/skills/releasing/SKILL.md` with a trigger-oriented description, and leave nothing in CLAUDE.md (the skill loads itself when the user asks to cut a release). If a one-line reminder helps discovery, that is the most CLAUDE.md should carry:

```markdown
- To cut a release, use the `releasing` skill.
```

Even that line is optional, since a well-described skill is found without it.

## The pattern across all three

Each fix removes content from the always-loaded budget without losing any information: the API detail, the release steps, and the resolved test rule are all still reachable. What changed is *when* they enter context. CLAUDE.md shrinks toward the small set of facts Claude needs in memory at all times, and everything else loads on demand.
