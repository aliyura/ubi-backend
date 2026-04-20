import { PrismaClient, USER_ROLE, ACCOUNT_TYPE } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@ubi.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '+2340000000000';
const BCRYPT_ROUNDS = 10;

async function main() {
  const existing = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      fullname: 'Super Admin',
      username: 'superadmin',
      email: ADMIN_EMAIL,
      phoneNumber: ADMIN_PHONE,
      password: hashedPassword,
      role: USER_ROLE.ADMIN,
      accountType: ACCOUNT_TYPE.ADMIN,
      isEmailVerified: true,
      isPhoneVerified: true,
      currency: 'NGN',
      referralCode: 'ADMIN0000',
    },
  });

  console.log(`Admin seeded: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
