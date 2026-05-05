import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StatementController } from './statement.controller';
import { StatementService } from './statement.service';

@Module({
  imports: [PrismaModule],
  controllers: [StatementController],
  providers: [StatementService],
})
export class StatementModule {}
