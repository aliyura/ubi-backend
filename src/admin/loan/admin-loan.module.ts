import { Module } from '@nestjs/common';
import { AdminLoanController } from './admin-loan.controller';
import { AdminLoanService } from './admin-loan.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanApplicationModule } from 'src/loan-application/loan-application.module';
import { AgentModule } from 'src/agent/agent.module';

@Module({
  imports: [PrismaModule, LoanApplicationModule, AgentModule],
  controllers: [AdminLoanController],
  providers: [AdminLoanService],
  exports: [AdminLoanService],
})
export class AdminLoanModule {}
