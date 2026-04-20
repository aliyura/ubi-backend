import { Module } from '@nestjs/common';
import { RepaymentController } from './repayment.controller';
import { RepaymentService } from './repayment.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanApplicationModule } from 'src/loan-application/loan-application.module';

@Module({
  imports: [PrismaModule, LoanApplicationModule],
  controllers: [RepaymentController],
  providers: [RepaymentService],
})
export class RepaymentModule {}
