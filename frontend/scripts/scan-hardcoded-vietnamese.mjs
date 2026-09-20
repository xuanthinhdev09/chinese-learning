#!/usr/bin/env node
/**
 * Scan frontend source for hardcoded Vietnamese text (user-visible strings).
 * Vietnamese UI strings must live in src/i18n/locales/vi.json via t() keys.
 *
 * Heuristics (deliberately conservative to avoid pinyin false positives):
 * - Strips /* *​/ block comments (incl. JSX {​/* *​/}​) and // line comments first
 * - Matches Vietnamese-ONLY characters (ơ ư đ ă + tone-marked range U+1EA0-U+1EF9);
 *   bare à/á/è are shared with pinyin tone marks so they are not matched
 * - Chinese lesson content (pinyin tones, TTS tone maps) therefore passes
 *
 * Run from frontend/: node scripts/scan-hardcoded-vietnamese.mjs
 * Exit 1 if any leftover is found.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(process.cwd(), 'src');
const DIACRITICS = /[Ạ-ỹĂăĐđƠơƯư]/;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(p);
  }
  return files;
}

const leftovers = [];
for (const file of walk(SRC)) {
  // Strip block comments (JS and JSX {/* */}) before line scanning so
  // multi-line Vietnamese comments never trigger false positives
  const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  text.split('\n').forEach((line, i) => {
    const code = line.includes('//') ? line.slice(0, line.indexOf('//')) : line;
    if (DIACRITICS.test(code)) {
      leftovers.push(`${relative(process.cwd(), file).replace(/\\/g, '/')}:${i + 1}: ${line.trim().slice(0, 140)}`);
    }
  });
}

if (leftovers.length) {
  console.error(`[FAIL] ${leftovers.length} hardcoded Vietnamese string(s):`);
  for (const l of leftovers) console.error('  ' + l);
  process.exit(1);
}
console.log('[OK] No hardcoded Vietnamese text in src (comments and lesson content excluded)');
