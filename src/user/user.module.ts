import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ApiProvidersModule } from 'src/api-providers/api-providers.module';
import { EmailModule } from 'src/email/email.module';
import { FileModule } from 'src/file/file.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [PrismaModule, ApiProvidersModule, EmailModule, FileModule, NotificationModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
