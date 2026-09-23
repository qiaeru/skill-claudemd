#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { detectDelimiter } from './detect.js';

const [header, ...rows] = readFileSync(process.argv[2], 'utf8').trim().split('\n');
const sep = detectDelimiter(header);
const keys = header.split(sep);
const out = rows.map((r) => Object.fromEntries(r.split(sep).map((v, i) => [keys[i], v])));
console.log(JSON.stringify(out, null, 2));
