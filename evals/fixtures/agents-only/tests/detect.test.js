import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDelimiter } from '../src/detect.js';

test('semicolon export', () => assert.equal(detectDelimiter('a;b;c'), ';'));
test('comma export', () => assert.equal(detectDelimiter('a,b,c'), ','));
