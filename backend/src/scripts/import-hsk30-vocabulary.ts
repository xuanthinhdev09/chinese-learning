#!/usr/bin/env tsx
/**
 * HSK 3.0 Vocabulary Import Script
 * Source: ivankra/hsk30 - https://github.com/ivankra/hsk30
 *
 * Usage:
 *   npm run import:hsk30 -- --lesson-id=<lessonId> --level=<level>
 *   npm run import:hsk30 -- --lesson-id=<lessonId> --min-level=<level> --max-level=<level>
 *
 * Examples:
 *   npm run import:hsk30 -- --lesson-id=hsk1-lesson-1 --level=1
 *   npm run import:hsk30 -- --lesson-id=hsk2-lesson-1 --level=2
 *   npm run import:hsk30 -- --lesson-id=hsk2-lesson-1 --min-level=1 --max-level=2
 */

import { PrismaClient } from '@prisma/client';

const HSK30_CSV_URL = 'https://raw.githubusercontent.com/ivankra/hsk30/master/hsk30.csv';

interface HSK30CsvRow {
  ID: string;
  Simplified: string;
  Traditional: string;
  Pinyin: string;
  POS: string;
  Level: string;
  WebNo: string;
  WebPinyin: string;
  OCR: string;
  Variants: string;
  CEDICT: string;
}

interface ImportVocabularyItem {
  lessonId: string;
  hanzi: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  pos: string;
  hskCode: string;
  hskLevel: number;
  variants: string;
  cedict: string;
}

function parseHSK30Csv(
  csvContent: string,
  lessonId: string,
  minLevel: number = 1,
  maxLevel: number = 9
): ImportVocabularyItem[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');

  const items: ImportVocabularyItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV handling quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const row: Partial<HSK30CsvRow> = {};
    headers.forEach((header, index) => {
      row[header.trim() as keyof HSK30CsvRow] = values[index] || '';
    });

    const level = parseInt(row.Level || '0');

    // Filter by HSK level range
    if (level < minLevel || level > maxLevel) continue;

    items.push({
      lessonId,
      hanzi: row.Simplified || '',
      traditional: row.Traditional || row.Simplified || '',
      pinyin: row.Pinyin || '',
      meaning: `HSK ${level} vocabulary`, // Default meaning
      pos: row.POS || '',
      hskCode: row.ID || '',
      hskLevel: level,
      variants: row.Variants || '',
      cedict: row.CEDICT || '',
    });
  }

  return items;
}

async function main() {
  const args = process.argv.slice(2);
  const lessonIdArg = args.find(arg => arg.startsWith('--lesson-id='));
  const levelArg = args.find(arg => arg.startsWith('--level='));
  const minLevelArg = args.find(arg => arg.startsWith('--min-level='));
  const maxLevelArg = args.find(arg => arg.startsWith('--max-level='));

  const lessonId = lessonIdArg?.split('=')[1];
  const singleLevel = levelArg ? parseInt(levelArg.split('=')[1]) : null;
  const minLevel = minLevelArg ? parseInt(minLevelArg.split('=')[1]) : singleLevel || 1;
  const maxLevel = maxLevelArg ? parseInt(maxLevelArg.split('=')[1]) : singleLevel || 2;

  if (!lessonId) {
    console.error('❌ Error: --lesson-id is required');
    console.log('Usage: npm run import:hsk30 -- --lesson-id=<lessonId> --level=<level>');
    console.log('       npm run import:hsk30 -- --lesson-id=<lessonId> --min-level=<level> --max-level=<level>');
    process.exit(1);
  }

  const levelRange = singleLevel ? `${singleLevel}` : `${minLevel}-${maxLevel}`;
  console.log(`📚 Importing HSK 3.0 vocabulary (level ${levelRange})...`);
  console.log(`📖 Lesson ID: ${lessonId}`);
  console.log(`🌐 Source: ${HSK30_CSV_URL}\n`);

  const prisma = new PrismaClient();

  try {
    // Fetch CSV from GitHub
    console.log('⬇️  Fetching CSV from GitHub...');
    const response = await fetch(HSK30_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    const csvContent = await response.text();
    console.log(`✅ Downloaded ${csvContent.length} bytes\n`);

    // Parse CSV
    console.log('🔄 Parsing CSV...');
    const items = parseHSK30Csv(csvContent, lessonId, minLevel, maxLevel);
    console.log(`✅ Found ${items.length} vocabulary items (HSK ${levelRange})\n`);

    // Group by HSK level for summary
    const byLevel: Record<number, number> = {};
    items.forEach(item => {
      byLevel[item.hskLevel] = (byLevel[item.hskLevel] || 0) + 1;
    });

    console.log('📊 Summary by level:');
    Object.entries(byLevel)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([level, count]) => {
        console.log(`   HSK ${level}: ${count} words`);
      });

    // Import to database
    console.log('\n💾 Importing to database...');
    const result = await prisma.vocabulary.createMany({
      data: items.map(item => ({
        lessonId: item.lessonId,
        hanzi: item.hanzi,
        traditional: item.traditional || null,
        pinyin: item.pinyin,
        meaning: item.meaning,
        pos: item.pos || null,
        hskCode: item.hskCode,
        hskLevel: item.hskLevel,
        variants: item.variants || null,
        cedict: item.cedict || null,
      })),
      skipDuplicates: true,
    });

    console.log(`\n✅ Import complete!`);
    console.log(`📊 Imported: ${result.count} items`);
    console.log(`📊 Skipped: ${items.length - result.count} duplicates`);

    // Show sample
    console.log('\n🔤 Sample words:');
    const samples = await prisma.vocabulary.findMany({
      where: { lessonId },
      orderBy: { hskCode: 'asc' },
      take: 5,
    });

    samples.forEach(sample => {
      console.log(`   ${sample.hskCode}: ${sample.hanzi} (${sample.traditional}) - ${sample.pinyin} - ${sample.pos || ''}`);
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
