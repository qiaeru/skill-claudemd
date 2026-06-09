# CLAUDE.md optimization skill

A Claude Code skill that trims a project's `CLAUDE.md` down to what is strictly necessary.

Claude loads `CLAUDE.md` in full into the context window at the start of every session, so every line costs tokens for the whole conversation and competes with your instructions. A bloated file wastes context and lowers adherence: when the file runs too long, Claude loses the load-bearing rules in the noise.

This skill applies Anthropic's published guidance for [memory files](https://code.claude.com/docs/en/memory) and [Claude Code best practices](https://code.claude.com/docs/en/best-practices). It scans the project's existing documentation and replaces anything derivable or already written down with an on-demand reference, instead of rewriting it inside `CLAUDE.md`. The file stays short, saves context tokens, and stops drifting out of sync with the docs it would otherwise duplicate.

## Layout

```text
skill-claudemd/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── .github/
│   └── FUNDING.yml
├── .gitattributes
├── .gitignore
├── README.md
├── CHANGELOG.md
├── LICENSE
└── skills/
    └── optimizing-claude-md/
        ├── SKILL.md
        └── references/
            ├── include-exclude.md
            ├── referencing-techniques.md
            └── examples.md
```

The repository doubles as a Claude Code plugin named `claudemd` and as its own plugin marketplace: `plugin.json` describes the plugin (the whole repository, with the skill under `skills/`), and `marketplace.json` lists it so Claude Code can install and update it straight from GitHub.

## How it works

The skill runs every block of a `CLAUDE.md` through two tests, in order:

1. **Keep or cut.** "Would removing this cause Claude to make a mistake?" If not, it goes. The skill drops self-evident advice, standard conventions, and anything Claude already does correctly.
2. **Copy or reference.** For what survives: "Is this already in the code or the docs?" If so, the skill replaces the copy with a pointer to the source, so there is one source of truth and no launch-time token cost.

It then resolves contradictions to a single source of truth, restructures the survivors with headers and concrete phrasing, moves misplaced content out to skills, path-scoped rules, nested CLAUDE.md files, or hooks (for rules that must run every time without exception), and reports the before and after line count.

The key distinction the skill teaches is that not every "reference" saves tokens. A prose pointer loads on demand and costs one line; an `@path` import loads the whole file at launch and saves nothing. The [referencing-techniques](skills/optimizing-claude-md/references/referencing-techniques.md) reference covers all five mechanisms (prose pointer, import, path-scoped rule, nested CLAUDE.md, skill), plus hooks, and when to use each.

## Installation

### As a plugin (recommended)

The plugin installs once and updates through Claude Code, with no re-copying. Inside Claude Code, add this repository as a marketplace, then install the plugin:

```shell
/plugin marketplace add Qiaeru/skill-claudemd
/plugin install claudemd@skill-claudemd
```

When a new version of the plugin is published, update it with `/plugin update claudemd`, or let Claude Code's automatic update pick it up. You can confirm the skill was loaded by asking Claude for the list of available skills.

### By manual copy

Claude Code also loads a project's standalone skills from the `.claude/skills/` folder at the root of that project, and global skills from `~/.claude/skills/`.

To install the skill this way, copy the [skills/optimizing-claude-md/](skills/optimizing-claude-md/) folder into that project's `.claude/skills/` directory, creating that directory if it does not exist. For an installation that applies to all your projects, copy the same folder into `~/.claude/skills/` instead. Restart Claude Code so the skill is detected.

When you change the skill in this repo, re-copy the `skills/optimizing-claude-md/` folder into the target project's `.claude/skills/` (or its global equivalent) and restart Claude Code, since skill content is not hot-reloaded.

## Usage

Once installed, ask Claude to "optimize the CLAUDE.md" (or trim, audit, shrink, clean up, improve it). Claude recognizes the request from the skill's `description` and runs the procedure: it reads the current `CLAUDE.md`, inventories the project's docs, then cuts, references, de-duplicates, and restructures, ending with a before and after line count.

You can also invoke it explicitly by name for a full pass (`/claudemd:optimizing-claude-md` when installed as a plugin, `/optimizing-claude-md` when copied manually), or point it at a specific file (`CLAUDE.local.md`, a nested `CLAUDE.md`, or an `AGENTS.md` you want wired up by import).

If the project has no `CLAUDE.md` yet, the skill suggests running `/init` first to generate a starting point from the codebase, then optimizes the result.

## Limits

- The skill optimizes an existing `CLAUDE.md`; it does not author one from scratch. Use `/init` for that, then optimize.
- It does not edit auto memory (`MEMORY.md`, the notes Claude Code writes for itself). It only routes learning-type content found in `CLAUDE.md` toward that system, since auto memory already captures discovered facts on its own.
- It only points to documentation that exists. It will not invent references, and it verifies each pointer resolves before writing it.
- It judges form and structure against Anthropic's guidance, not the correctness of your project's rules. If a rule is wrong, the skill keeps it; it only decides whether it belongs in `CLAUDE.md` and how to phrase it.
- The 200-line target is a soft ceiling. The skill never deletes a load-bearing rule just to hit a number.

## License

MIT, see [LICENSE](LICENSE).
