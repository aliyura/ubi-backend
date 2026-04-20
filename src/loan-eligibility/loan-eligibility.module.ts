import { Module } from '@nestjs/common';
import { LoanEligibilityService } from './loan-eligibility.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LoanEligibilityService],
  exports: [LoanEligibilityService],
})
export class LoanEligibilityModule {}
