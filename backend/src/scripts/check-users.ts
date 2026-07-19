import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
    }
  });

  console.log('👥 Users in database:', users.length);
  users.forEach(u => {
    console.log(`  - ${u.email} (${u.username})`);
  });

  if (users.length === 0) {
    console.log('\n⚠️ No users found. Need to register first.');
  }

  await prisma.$disconnect();
}

main();
