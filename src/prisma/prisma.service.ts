import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, USER_ROLE, ACCOUNT_TYPE } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to the database');

      const extensionExists = await this.$queryRawUnsafe<
        Array<{ extname: string }>
      >(`SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'`);

      if (extensionExists.length === 0) {
        await this.$executeRawUnsafe(`CREATE EXTENSION "uuid-ossp";`);
        console.log('uuid-ossp extension is enabled');
      } else {
        console.log('uuid-ossp extension already exists');
      }

      await this.seedAdmin();
    } catch (err) {
      console.error('Error during database initialization:', err);
    }
  }

  private async seedAdmin() {
    const email = process.env.ADMIN_EMAIL ?? 'admin@ubi.com';
    const password = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
    const phone = process.env.ADMIN_PHONE ?? '+2340000000000';

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.user.upsert({
      where: { email },
      update: {},
      create: {
        fullname: 'Super Admin',
        username: 'superadmin',
        email,
        phoneNumber: phone,
        password: hashedPassword,
        role: USER_ROLE.ADMIN,
        accountType: ACCOUNT_TYPE.ADMIN,
        isEmailVerified: true,
        isPhoneVerified: true,
        currency: 'NGN',
        referralCode: 'ADMIN0000',
      },
    });

    console.log(`Admin seeded: ${email}`);
  }
}
