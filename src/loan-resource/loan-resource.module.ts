import { Module } from '@nestjs/common';
import { LoanResourceController } from './loan-resource.controller';
import { LoanResourceService } from './loan-resource.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoanResourceController],
  providers: [LoanResourceService],
  exports: [LoanResourceService],
})
export class LoanResourceModule {}
