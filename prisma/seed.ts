import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/common/utils/password';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();
  await prisma.credentials.deleteMany();

  console.log('Seeding...');

  const hash = await hashPassword('password');
  const user1 = await prisma.user.create({
    data: {
      email: 'memart@simpson.com',
      name: 'Memart',
      is_admin: false,
      email_confirmed: true,
      credentials: {
        create: {
          hash,
        },
      },
    },
    include: { credentials: true },
  });
  const user2 = await prisma.user.create({
    data: {
      email: 'lema@simpson.com',
      name: 'Lema',
      is_admin: true,
      email_confirmed: true,
      credentials: {
        create: {
          hash,
        },
      },
    },
    include: { credentials: true },
  });

  console.log({ user1, user2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
