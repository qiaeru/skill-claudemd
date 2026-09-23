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
// LICENSE is fixed legal text, so neither is in scope; the eval suite
// under evals/ holds deliberately bad CLAUDE.md fixtures, not prose.
const proseFiles = ['README.md', 'CHANGELOG.md'];
const collectMarkdown = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) collectMarkdown(filePath);
    else if (entry.name.endsWith('.md')) proseFiles.push(filePath);
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

// 5. The claude plugin eval suite under evals/: each case has a prompt, a
// scaffold script that copies an existing fixture, and graders of a known
// type whose regexes compile, since a broken pattern only shows up as a
// silent zero after a paid run. An expected_outcome quoting a fixture's
// original line count must match it, and no fixture file may be
// gitignored: the root .gitignore ignores every CLAUDE.md, so a fixture
// exists locally yet never reaches the remote unless a negation keeps it.
const GRADER_TYPES = new Set(['regex', 'tool_used', 'tool_order', 'file_exists', 'llm', 'baseline']);
const frontmatter = (text) => {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!block) return null;
  const fields = {};
  for (const line of block[1].split(/\r?\n/)) {
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const value = m[2].trim();
    fields[m[1]] = /^'.*'$/.test(value) ? value.slice(1, -1).replace(/''/g, "'") : value;
  }
  return { fields, body: block[2].trim() };
};
const isIgnored = (file) => {
  try {
    execFileSync('git', ['check-ignore', '-q', '--no-index', file], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
const EVALS = 'evals';
const FIXTURES = path.join(EVALS, 'fixtures');
if (!existsSync(EVALS)) {
  report(EVALS, null, 'eval suite missing');
} else {
  const cases = readdirSync(EVALS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(path.join(EVALS, e.name, 'prompt.md')))
    .map((e) => path.join(EVALS, e.name));
  if (cases.length === 0) report(EVALS, null, 'no eval case found');
  for (const dir of cases) {
    const prompt = frontmatter(read(path.join(dir, 'prompt.md')));
    if (!prompt || !prompt.body) report(dir, null, 'prompt.md needs frontmatter and a prompt body');
    let fixture = null;
    const caseFile = path.join(dir, 'case.yaml');
    if (existsSync(caseFile)) {
      const caseText = read(caseFile);
      if (!/^schema_version:\s*"1\.1"/m.test(caseText)) report(caseFile, null, 'schema_version "1.1" missing');
      const script = caseText.match(/scaffold_script:\s*(\S+)/);
      if (script) {
        const scriptPath = path.join(dir, script[1]);
        if (!existsSync(scriptPath)) {
          report(caseFile, null, `scaffold script ${script[1]} missing`);
        } else {
          const name = read(scriptPath).match(/fixtures\/([\w-]+)/);
          fixture = name && path.join(FIXTURES, name[1]);
          if (!fixture || !existsSync(fixture)) report(scriptPath, null, 'copies no existing fixture under evals/fixtures/');
        }
      }
    }
    const quoted = prompt?.fields.expected_outcome?.match(/original (\d+) lines/);
    if (quoted && fixture) {
      const memory = ['CLAUDE.md', 'AGENTS.md'].map((f) => path.join(fixture, f)).find(existsSync);
      const actual = memory && read(memory).replace(/\r?\n$/, '').split(/\r?\n/).length;
      if (actual !== Number(quoted[1])) {
        report(path.join(dir, 'prompt.md'), null, `expected_outcome says ${quoted[1]} lines, the fixture has ${actual}`);
      }
    }
    const graderDir = path.join(dir, 'graders');
    const graders = existsSync(graderDir) ? readdirSync(graderDir).filter((f) => f.endsWith('.md')) : [];
    if (graders.length === 0) report(dir, null, 'no grader under graders/');
    for (const g of graders) {
      const file = path.join(graderDir, g);
      const grader = frontmatter(read(file));
      if (!grader || !GRADER_TYPES.has(grader.fields.type)) {
        report(file, null, `unknown grader type "${grader?.fields.type}"`);
        continue;
      }
      for (const key of ['pattern', 'input_match']) {
        if (grader.fields[key] === undefined) continue;
        try {
          new RegExp(grader.fields[key], grader.fields.flags ?? '');
        } catch (e) {
          report(file, null, `${key} is not a valid JavaScript regex: ${e.message}`);
        }
      }
      if (grader.fields.type === 'llm' && !grader.body) report(file, null, 'llm grader without criteria');
    }
  }
  if (existsSync(FIXTURES)) {
    for (const file of walk(FIXTURES)) {
      if (isIgnored(file)) report(file, null, 'fixture is gitignored, it will be missing from the remote');
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
