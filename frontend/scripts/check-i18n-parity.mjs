#!/usr/bin/env node
/**
 * Check that vi/en/zh locale files carry identical key sets.
 * vi.json is the source of truth; en/zh must not miss or add keys.
 *
 * Run from frontend/: node scripts/check-i18n-parity.mjs
 * Exit 1 on any mismatch or invalid JSON.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['vi', 'en', 'zh'];

function flatten(obj, prefix = '', out = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, path, out);
    else out.add(path);
  }
  return out;
}

const keySets = Object.fromEntries(
  locales.map((locale) => {
    const file = join(root, 'src', 'i18n', 'locales', `${locale}.json`);
    let parsed = {};
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`[FAIL] ${locale}.json is not valid JSON: ${err.message}`);
      process.exit(1);
    }
    return [locale, flatten(parsed)];
  })
);

const base = keySets.vi;

// English pluralizes some keys via i18next `_one`/`_other` suffixes in place of
// the single base key (vi/zh have one form for all counts). Collapse those
// variants back to the base key so the key-set comparison stays 1:1.
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const enKeys = new Set(
  [...keySets.en].map((k) => k.replace(PLURAL_SUFFIX, ''))
);
const normalized = { en: enKeys };

let failed = false;

for (const locale of locales.slice(1)) {
  const keys = normalized[locale] ?? keySets[locale];
  const missing = [...base].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !base.has(k));
  if (missing.length) {
    failed = true;
    console.error(`[FAIL] ${locale}.json missing ${missing.length} key(s):`);
    for (const k of missing) console.error(`  - ${k}`);
  }
  if (extra.length) {
    failed = true;
    console.error(`[FAIL] ${locale}.json has ${extra.length} extra key(s):`);
    for (const k of extra) console.error(`  + ${k}`);
  }
  if (!missing.length && !extra.length) {
    console.log(`[OK] ${locale}.json matches vi.json`);
  }
}

console.log(`Total vi keys: ${base.size}`);
process.exit(failed ? 1 : 0);
