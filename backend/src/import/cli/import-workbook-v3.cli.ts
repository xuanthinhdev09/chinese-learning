import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import { importWorkbookV3 } from '../workbook/workbook-v3.importer';

/**
 * CLI: import one workbook lesson JSON v3 into the DB.
 *
 *   npm run import:workbook -- --file ../../content-source/extracted-wb/lesson-01.json
 *   npm run import:workbook -- --file ... --dry-run
 *
 * Defaults expect the repo layout: content-source sits two levels above
 * backend/. Media copies are best-effort — missing files are listed, the
 * images are expected to arrive via UI upload instead.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const fileArgIdx = args.indexOf('--file');
  const file = fileArgIdx >= 0 ? args[fileArgIdx + 1] : undefined;
  const dryRun = args.includes('--dry-run');
  const contentSource = path.resolve(process.cwd(), '../../content-source');

  if (!file) {
    console.error('Usage: npm run import:workbook -- --file <lesson-NN.json> [--dry-run]');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const result = await importWorkbookV3(prisma, {
      file: path.resolve(file),
      audioDir: path.join(contentSource, 'audio', 'hsk2'),
      imagesDir: path.join(contentSource, 'exercise-images'),
      dryRun,
    });
    console.log(
      `✅ Lesson ${result.lessonOrder}: exercises=${result.exercisesUpserted} ` +
        `images=${result.imagesUpserted} ` +
        `(removed: ${result.exercisesRemoved} exercises, ${result.imagesRemoved} images)`,
    );
    if (result.audioCopied.length) console.log(`🔊 audio copied: ${result.audioCopied.join(', ')}`);
    if (result.imagesCopied.length) console.log(`🖼️  images copied: ${result.imagesCopied.length}`);
    if (result.audioMissingOnDisk.length) {
      console.warn(`⚠️  audio missing on disk: ${result.audioMissingOnDisk.join(', ')}`);
    }
    if (result.imagesMissingOnDisk.length) {
      console.warn(
        `⏳ ${result.imagesMissingOnDisk.length} images pending upload (upload via UI):\n` +
          result.imagesMissingOnDisk.map((f) => `   - ${f}`).join('\n'),
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: Error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
