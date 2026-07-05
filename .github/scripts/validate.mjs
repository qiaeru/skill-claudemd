// Checks the repo invariants that break silently, complementing the
// "plugin validate" step run by the workflow. Runs locally with
// "node .github/scripts/validate.mjs" from the repo root.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const errors = [];
const report = (file, line, message) =>
  errors.push(line ? `${file}:${line} ${message}` : `${file} ${message}`);

const read = (file) => readFileSync(file, 'utf8');

// Prose covered by the style and link checks. CLAUDE.md is gitignored and
// LICENSE is fixed legal text, so neither is in scope.
const proseFiles = ['README.md', 'CHANGELOG.md'];
const collectMarkdown = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) collectMarkdown(filePath);
    else if (entry.name.endsWith('.md')) proseFiles.push(filePath);
  }
};
collectMarkdown('skills');

// 1. Each SKILL.md: frontmatter with name equal to the folder and a
// description under 300 characters (the runtime reads only those two
// fields), and the file well under the 200-line ceiling it preaches.
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

// 4. The plugin version tracks the latest released CHANGELOG version, the
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
console.log(`Invariants checked across ${proseFiles.length} files: frontmatter, links, style, version.`);
