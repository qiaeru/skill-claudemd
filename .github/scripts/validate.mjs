// Checks the repo invariants that break silently, complementing the
// "plugin validate" step run by the workflow. Runs locally with
// "node .github/scripts/validate.mjs" from the repo root.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const errors = [];
const report = (file, line, message) =>
  errors.push(line ? `${file}:${line} ${message}` : `${file} ${message}`);

const read = (file) => readFileSync(file, 'utf8');

// Prose covered by the style and link checks. CLAUDE.md is gitignored and
// LICENSE is fixed legal text, so neither is in scope; the eval fixtures
// under skills/*/evals/ are deliberately bad CLAUDE.md files, not prose.
const proseFiles = ['README.md', 'CHANGELOG.md'];
const collectMarkdown = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'evals') collectMarkdown(filePath);
    } else if (entry.name.endsWith('.md')) proseFiles.push(filePath);
  }
};
collectMarkdown('skills');

// 1. Each SKILL.md: frontmatter with name equal to the folder, a
// description under 300 characters, description plus when_to_use under
// 600 (the runtime truncates the pair at 1,536 in the skill listing), and
// the file well under the 200-line ceiling it preaches.
for (const skillName of readdirSync('skills')) {
  const dir = path.join('skills', skillName);
  if (!statSync(dir).isDirectory()) continue;
  const file = path.join(dir, 'SKILL.md');
  if (!existsSync(file)) {
    report(dir, null, 'SKILL.md missing');
    continue;
  }
  const text = read(file);
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) {
    report(file, 1, 'frontmatter missing');
    continue;
  }
  const fields = {};
  for (const line of block[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+)\s*:\s*(.*)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  if (fields.name !== skillName) {
    report(file, 2, `name "${fields.name}" differs from the folder "${skillName}"`);
  }
  if (!fields.description) {
    report(file, 3, 'description missing from the frontmatter');
  } else if ([...fields.description].length > 300) {
    report(file, 3, `description is ${[...fields.description].length} characters, maximum 300`);
  }
  const listing = [...(fields.description ?? '') + (fields.when_to_use ?? '')].length;
  if (listing > 600) {
    report(file, 3, `description plus when_to_use is ${listing} characters, maximum 600`);
  }
  const lineCount = text.split(/\r?\n/).length;
  if (lineCount >= 200) {
    report(file, null, `${lineCount} lines, must stay under the 200-line ceiling`);
  }
}

// 2. Relative links: every target exists, and a link emitted from inside a
// skill folder stays confined to it, since manual-copy installs copy only
// that folder.
const LINK_PATTERN = /\[[^\]]*\]\(([^)\s]+)\)/g;
for (const file of proseFiles) {
  const text = read(file);
  for (const m of text.matchAll(LINK_PATTERN)) {
    const target = m[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    const line = text.slice(0, m.index).split('\n').length;
    const resolved = path.resolve(path.dirname(file), target);
    if (!existsSync(resolved)) {
      report(file, line, `dead link to ${target}`);
      continue;
    }
    const segments = file.split(path.sep);
    if (segments[0] === 'skills' && segments.length > 2) {
      const skillDir = path.resolve(segments[0], segments[1]);
      if (!resolved.startsWith(skillDir + path.sep) && resolved !== skillDir) {
        report(file, line, `link to ${target}, outside the skill's installable folder`);
      }
    }
  }
}

// 3. Markdown style rules from the dev notes, on the repo's own prose:
// no em-dashes or en-dashes, table separators spaced as "| --- |", and
// every fenced block carrying a language tag. Syntactic exceptions:
// frontmatter, code fences, code spans, link targets, URLs.
const CHECKS = [
  [/—/, 'em-dash in prose, replace with a period, colon, comma, or parentheses'],
  [/–/, 'en-dash in prose, replace with a regular hyphen or rephrase'],
];
for (const file of proseFiles) {
  const lines = read(file).split(/\r?\n/);
  let inFence = false;
  let inFrontmatter = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (i === 0 && raw === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (raw === '---') inFrontmatter = false;
      continue;
    }
    if (/^\s*(```|~~~)/.test(raw)) {
      if (!inFence && /^\s*(```|~~~)\s*$/.test(raw)) {
        report(file, i + 1, 'fenced block without a language tag (use "text" for ASCII trees)');
      }
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^\s*\|[\s|:-]*-[\s|:-]*$/.test(raw) && !/^\s*\|( :?-{3,}:? \|)+\s*$/.test(raw)) {
      report(file, i + 1, 'table separator not spaced as "| --- |"');
    }
    const cleaned = raw
      .replace(/`[^`]*`/g, '')
      .replace(/\]\([^)]*\)/g, ']')
      .replace(/https?:\/\/\S+/g, '');
    for (const [pattern, message] of CHECKS) {
      if (pattern.test(cleaned)) report(file, i + 1, message);
    }
  }
}

// 4. A bare @path outside code in the skill's own markdown would attach
// that file when the skill loads, the exact trap the skill warns about.
// The prose files under skills/ are the only ones a skill loader reads.
const BARE_IMPORT = /(^|[^`\w])@(~?\/?[\w.-]+\/[\w./-]*|[\w-]+\.md)/;
for (const file of proseFiles.filter((f) => f.startsWith('skills'))) {
  const lines = read(file).split(/\r?\n/);
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const cleaned = lines[i].replace(/`[^`]*`/g, '');
    if (BARE_IMPORT.test(cleaned)) {
      report(file, i + 1, 'bare @path outside code, it would be attached when the skill loads');
    }
  }
}

// 5. Each skill's evals/evals.json, when present, has the shape the
// skill-creator plugin reads and names only fixture files that exist and
// are not gitignored: the root .gitignore ignores every CLAUDE.md, so a
// fixture CLAUDE.md exists locally yet never reaches the remote unless a
// negation keeps it tracked.
const isIgnored = (file) => {
  try {
    execFileSync('git', ['check-ignore', '-q', file], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
for (const skillName of readdirSync('skills')) {
  const file = path.join('skills', skillName, 'evals', 'evals.json');
  if (!existsSync(file)) continue;
  let data;
  try {
    data = JSON.parse(read(file));
  } catch (e) {
    report(file, null, `not valid JSON: ${e.message}`);
    continue;
  }
  if (data.skill_name !== skillName) {
    report(file, null, `skill_name "${data.skill_name}" differs from the folder "${skillName}"`);
  }
  if (!Array.isArray(data.evals) || data.evals.length === 0) {
    report(file, null, 'evals must be a non-empty array');
    continue;
  }
  const ids = new Set();
  for (const ev of data.evals) {
    if (ids.has(ev.id)) report(file, null, `duplicate eval id ${ev.id}`);
    ids.add(ev.id);
    for (const key of ['prompt', 'expected_output']) {
      if (typeof ev[key] !== 'string' || !ev[key].trim()) report(file, null, `eval ${ev.id}: ${key} missing`);
    }
    if (!Array.isArray(ev.expectations) || ev.expectations.length === 0) {
      report(file, null, `eval ${ev.id}: expectations missing`);
    }
    for (const fixture of ev.files ?? []) {
      const fixturePath = path.join('skills', skillName, fixture);
      if (!existsSync(fixturePath)) {
        report(file, null, `eval ${ev.id}: fixture ${fixture} does not exist`);
      } else if (isIgnored(fixturePath)) {
        report(file, null, `eval ${ev.id}: fixture ${fixture} is gitignored, it will be missing from the remote`);
      }
    }
  }
}

// 6. The plugin version tracks the latest released CHANGELOG version, the
// agreement that manual releases let drift first.
const manifest = JSON.parse(read('.claude-plugin/plugin.json'));
const released = read('CHANGELOG.md').match(/^## \[(\d+\.\d+\.\d+)\]/m);
if (!released) {
  report('CHANGELOG.md', null, 'no released version found');
} else if (manifest.version !== released[1]) {
  report(
    '.claude-plugin/plugin.json',
    null,
    `version ${manifest.version} differs from the latest released CHANGELOG version ${released[1]}`,
  );
}

if (errors.length > 0) {
  console.error(`${errors.length} invariant error(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`Invariants checked across ${proseFiles.length} files: frontmatter, links, style, imports, evals, version.`);
