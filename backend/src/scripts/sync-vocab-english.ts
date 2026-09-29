#!/usr/bin/env tsx
/**
 * Sync translated English glosses (and corrected Vietnamese) into the DB.
 *
 * Reads extracted-v2/lesson-NN.json — where translate_vocab_english.py wrote
 * `english` and fix_meanings_model_knowledge.py wrote the corrected `vietnamese`
 * — and writes them into `vocabularies.meaningEn` / `vocabularies.meaning`.
 * Matches by (HSK2 course lesson order → lessonId, hanzi). Idempotent.
 *
 * Usage:
 *   npx tsx src/scripts/sync-vocab-english.ts [path-to-extracted-v2]
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dirArg = process.argv[2];
  const dir = path.resolve(dirArg ?? path.join(process.cwd(), '../../content-source/extracted-v2'));

  const course = await prisma.course.findFirst({ where: { type: 'HSK', level: 2 } });
  if (!course) {
    console.error('❌ HSK2 course not found');
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => /^lesson-\d+\.json$/.test(f))
    .sort();

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    const order = data.lesson?.order;
    const vocab = data.lesson?.vocabulary ?? [];
    if (!order) continue;

    const lesson = await prisma.lesson.findFirst({ where: { courseId: course.id, order } });
    if (!lesson) {
      console.log(`  bài ${order}: không có trong DB — bỏ qua`);
      continue;
    }

    // Load all vocab for this lesson once (avoid N+1 per hanzi).
    const rows = await prisma.vocabulary.findMany({
      where: { lessonId: lesson.id },
      select: { id: true, hanzi: true, meaning: true, meaningEn: true },
    });
    const byHanzi = new Map(rows.map((r) => [r.hanzi, r]));

    for (const v of vocab) {
      const row = byHanzi.get(v.hanzi);
      if (!row) {
        missing++;
        continue;
      }
      const patch: { meaning?: string; meaningEn?: string } = {};
      if (v.vietnamese && row.meaning !== v.vietnamese) patch.meaning = v.vietnamese;
      if (v.english && row.meaningEn !== v.english) patch.meaningEn = v.english;
      if (Object.keys(patch).length === 0) {
        skipped++;
        continue;
      }
      await prisma.vocabulary.update({ where: { id: row.id }, data: patch });
      updated++;
    }
    console.log(`  bài ${order}: done (${vocab.length} từ)`);
  }

  console.log(`DONE updated=${updated} skipped=${skipped} missing=${missing}`);
}

main()
  .catch((e) => {
    console.error('❌', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
