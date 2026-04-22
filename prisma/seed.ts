import { PrismaClient, TIER_LEVEL, USER_ROLE, ACCOUNT_TYPE } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
  TIER_ONE_PER_TRANSACTION_LIMIT,
  TIER_TWO_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  TIER_TWO_CUMMULATIVE_BALANCE_LIMIT,
  TIER_TWO_PER_TRANSACTION_LIMIT,
  TIER_THREE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  TIER_THREE_CUMMULATIVE_BALANCE_LIMIT,
  TIER_THREE_PER_TRANSACTION_LIMIT,
} from '../src/constants';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@ubi.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '+2340000000000';
const BCRYPT_ROUNDS = 10;

async function seedAdmin() {
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

async function seedTiers() {
  const tiers = [
    {
      level: TIER_LEVEL.notSet,
      name: 'Tier 0',
      kycLevel: 0,
      dailyLimit: 0,
      perTransactionLimit: 0,
      walletLimit: 0,
    },
    {
      level: TIER_LEVEL.one,
      name: 'Tier 1',
      kycLevel: 1,
      dailyLimit: TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
      perTransactionLimit: TIER_ONE_PER_TRANSACTION_LIMIT,
      walletLimit: TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
    },
    {
      level: TIER_LEVEL.two,
      name: 'Tier 2',
      kycLevel: 2,
      dailyLimit: TIER_TWO_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
      perTransactionLimit: TIER_TWO_PER_TRANSACTION_LIMIT,
      walletLimit: TIER_TWO_CUMMULATIVE_BALANCE_LIMIT,
    },
    {
      level: TIER_LEVEL.three,
      name: 'Tier 3',
      kycLevel: 3,
      dailyLimit: TIER_THREE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
      perTransactionLimit: TIER_THREE_PER_TRANSACTION_LIMIT,
      walletLimit: TIER_THREE_CUMMULATIVE_BALANCE_LIMIT,
    },
  ];

  for (const tier of tiers) {
    await prisma.tier.upsert({
      where: { level: tier.level },
      update: {},
      create: tier,
    });
    console.log(`Tier seeded: ${tier.name}`);
  }
}

async function main() {
  await seedAdmin();
  await seedTiers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
