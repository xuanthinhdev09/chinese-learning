#!/usr/bin/env tsx
/**
 * Sync English glosses for dialogue lines into the DB.
 *
 * Reads extracted-v2/conversations-lesson-NN.json — where
 * apply_conversation_english.py wrote `english` — and writes each into
 * `conversations.english`, matched by (HSK2 lesson order → lessonId, order).
 * Idempotent.
 *
 * Usage:
 *   npx tsx src/scripts/sync-conversation-english.ts [path-to-extracted-v2]
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
    .filter((f) => /^conversations-lesson-\d+\.json$/.test(f))
    .sort();

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    const order = data.lesson_order;
    const convs = data.conversations ?? [];
    if (!order) continue;

    const lesson = await prisma.lesson.findFirst({ where: { courseId: course.id, order } });
    if (!lesson) {
      console.log(`  bài ${order}: không có trong DB — bỏ qua`);
      continue;
    }

    const rows = await prisma.conversation.findMany({
      where: { lessonId: lesson.id },
      select: { id: true, order: true, english: true },
    });
    const byOrder = new Map(rows.map((r) => [r.order, r]));

    for (const c of convs) {
      const row = byOrder.get(c.order);
      if (!row) {
        missing++;
        continue;
      }
      if (!c.english || row.english === c.english) {
        skipped++;
        continue;
      }
      await prisma.conversation.update({ where: { id: row.id }, data: { english: c.english } });
      updated++;
    }
    console.log(`  bài ${order}: done (${convs.length} dòng)`);
  }

  console.log(`DONE updated=${updated} skipped=${skipped} missing=${missing}`);
}

main()
  .catch((e) => {
    console.error('❌', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
