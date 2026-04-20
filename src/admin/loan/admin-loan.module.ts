import { Module } from '@nestjs/common';
import { AdminLoanController } from './admin-loan.controller';
import { AdminLoanService } from './admin-loan.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanApplicationModule } from 'src/loan-application/loan-application.module';

@Module({
  imports: [PrismaModule, LoanApplicationModule],
  controllers: [AdminLoanController],
  providers: [AdminLoanService],
  exports: [AdminLoanService],
})
export class AdminLoanModule {}
