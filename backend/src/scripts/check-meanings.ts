import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const samples = await prisma.vocabulary.findMany({
    where: { hskLevel: 1 },
    orderBy: { hskCode: 'asc' },
    take: 10
  });

  console.log('🔤 Sample meanings:');
  samples.forEach(s => {
    console.log(`  ${s.hskCode}: ${s.hanzi} - "${s.meaning}"`);
  });

  await prisma.$disconnect();
}

main();
