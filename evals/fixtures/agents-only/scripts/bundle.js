// Copies src/ into a single CommonJS file under dist/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
writeFileSync('dist/cli.cjs', readFileSync('src/cli.js', 'utf8'));
