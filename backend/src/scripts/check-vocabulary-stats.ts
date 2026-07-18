import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Total count
  const total = await prisma.vocabulary.count();

  // By lesson
  const byLesson = await prisma.vocabulary.groupBy({
    by: ['lessonId'],
    _count: true,
  });

  // By HSK level
  const byLevel = await prisma.vocabulary.groupBy({
    by: ['hskLevel'],
    _count: true,
    where: { hskLevel: { not: null } },
  });

  // Sample from each lesson
  const hsk1Sample = await prisma.vocabulary.findFirst({
    where: { lessonId: 'hsk1-lesson-1' },
    orderBy: { hskCode: 'asc' },
  });

  const hsk2Sample = await prisma.vocabulary.findFirst({
    where: { lessonId: 'hsk2-lesson-1' },
    orderBy: { hskCode: 'asc' },
  });

  console.log('📊 Vocabulary Statistics');
  console.log('========================\n');
  console.log(`Total: ${total} words\n`);

  console.log('By Lesson:');
  byLesson.forEach((item) => {
    console.log(`  ${item.lessonId}: ${item._count} words`);
  });

  console.log('\nBy HSK Level:');
  byLevel
    .sort((a, b) => (a.hskLevel || 0) - (b.hskLevel || 0))
    .forEach((item) => {
      console.log(`  HSK ${item.hskLevel}: ${item._count} words`);
    });

  console.log('\n🔤 Samples:');
  console.log(`HSK 1 Lesson: ${hsk1Sample?.hanzi} (${hsk1Sample?.pinyin})`);
  console.log(`HSK 2 Lesson: ${hsk2Sample?.hanzi} (${hsk2Sample?.pinyin})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
