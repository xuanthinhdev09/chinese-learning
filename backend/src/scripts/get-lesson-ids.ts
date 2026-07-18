import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({
    select: { id: true, title: true, order: true },
    orderBy: { order: 'asc' },
  });

  console.log('Available Lessons:');
  console.log('===================');
  lessons.forEach((lesson) => {
    console.log(`${lesson.id} | ${lesson.title}`);
  });

  console.log('\nLesson IDs for import:');
  console.log(lessons.map((l) => l.id).join('\n'));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
