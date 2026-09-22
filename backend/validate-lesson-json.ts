// Validate a workbook-json-v3 file against the authoritative backend validator.
// Usage: npx tsx validate-lesson-json.ts <abs-path-to-lesson-NN.json>
import { readFileSync } from 'fs';
import { validateJsonV3 } from './src/import/workbook/json-v3.validator';

const path = process.argv[2];
if (!path) {
  console.error('usage: npx tsx validate-lesson-json.ts <lesson.json>');
  process.exit(1);
}
const d = JSON.parse(readFileSync(path, 'utf-8'));
const errors: string[] = validateJsonV3(d as never);
if (errors.length === 0) {
  console.log('VALIDATOR PASS — schema v3 OK:', path);
} else {
  console.log('VALIDATOR ERRORS (' + errors.length + '):');
  errors.forEach((e) => console.log(' -', e));
  process.exit(1);
}
