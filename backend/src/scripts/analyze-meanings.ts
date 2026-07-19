import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.vocabulary.count();
  const withPipe = await prisma.vocabulary.count({
    where: { meaning: { contains: '|' } }
  });
  const defaultMeaning = await prisma.vocabulary.count({
    where: { meaning: { contains: 'HSK' } }
  });
  const empty = await prisma.vocabulary.count({
    where: { meaning: '' }
  });

  console.log('📊 Meaning Analysis:');
  console.log(`  Total vocabularies: ${total}`);
  console.log(`  With pipe (EN|VN): ${withPipe}`);
  console.log(`  With "HSK" default: ${defaultMeaning}`);
  console.log(`  Empty meaning: ${empty}`);

  // Check if there was a manual update
  const sample = await prisma.vocabulary.findFirst({
    where: { meaning: { contains: '|' } }
  });
  console.log(`\n🔤 Sample with pipe: "${sample?.hanzi}" - "${sample?.meaning}"`);

  await prisma.$disconnect();
}

main();
