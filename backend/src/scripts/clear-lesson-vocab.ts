import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const lessonIdArg = args.find(arg => arg.startsWith('--lesson-id='));
  const lessonId = lessonIdArg?.split('=')[1];

  if (!lessonId) {
    console.error('❌ Error: --lesson-id is required');
    console.log('Usage: npx tsx clear-lesson-vocab.ts -- --lesson-id=<lessonId>');
    process.exit(1);
  }

  const result = await prisma.vocabulary.deleteMany({
    where: { lessonId },
  });

  console.log(`✅ Deleted ${result.count} vocabulary items from lesson ${lessonId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
