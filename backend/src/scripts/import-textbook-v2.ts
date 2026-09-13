#!/usr/bin/env tsx
/**
 * Textbook v2 Import Script
 * Imports a self-contained JSON v2 file (course + lessons + vocabulary +
 * conversations) produced by the offline PDF → JSON extraction workflow.
 *
 * Usage:
 *   npm run import:textbook -- <path-to-json>
 *   npm run import:textbook -- ../content-source/extracted/hsk2-textbook.json
 *
 * The script goes through TextbookV2Importer (same code path as the wizard
 * upload) — it never writes to the database directly.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { TextbookV2Importer } from '../import/textbook-v2/textbook-v2.importer';

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: npm run import:textbook -- <path-to-json-v2>');
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`❌ Invalid JSON: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  const prisma = new PrismaClient({ log: ['error', 'warn'] });
  await prisma.$connect();
  const importer = new TextbookV2Importer(prisma);

  try {
    const result = await importer.importTextbookV2(data as never);

    console.log(`📚 Course: ${result.course_name} (${result.course_type}) [${result.course_id}]`);
    console.log(
      `   Lessons: ${result.created_lessons} created, ${result.skipped_lessons} existing | ` +
        `Vocab: ${result.vocab_created} created, ${result.vocab_updated} updated | ` +
        `Keywords: ${result.keywords_flagged} | Conversations: ${result.conversations_replaced}`
    );

    for (const lesson of result.lessons) {
      console.log(
        `   • Bài ${lesson.order} "${lesson.title}": vocab +${lesson.vocab_created}/~${lesson.vocab_updated}, ` +
          `${lesson.keywords} keywords, ${lesson.conversations_replaced} conversation lines`
      );
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  ${result.warnings.length} warning(s):`);
      result.warnings.forEach((warning) => console.log(`   ${warning}`));
    }

    console.log('\n✅ Import completed');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  const payload = error?.response ?? error;
  console.error('❌ Import failed:');
  if (payload?.errors) {
    (payload.errors as string[]).forEach((message, index) =>
      console.error(`   ${index + 1}. ${message}`)
    );
  } else {
    console.error(`   ${payload?.message ?? payload}`);
  }
  process.exit(1);
});
