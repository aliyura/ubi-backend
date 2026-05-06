import { Module } from '@nestjs/common';
import { EmailModule } from 'src/email/email.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StatementController } from './statement.controller';
import { StatementService } from './statement.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [StatementController],
  providers: [StatementService],
})
export class StatementModule {}
