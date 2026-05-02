import { Module } from '@nestjs/common';
import { RepaymentController } from './repayment.controller';
import { RepaymentService } from './repayment.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanApplicationModule } from 'src/loan-application/loan-application.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [PrismaModule, LoanApplicationModule, NotificationModule],
  controllers: [RepaymentController],
  providers: [RepaymentService],
})
export class RepaymentModule {}
