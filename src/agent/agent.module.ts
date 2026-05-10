import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanApplicationModule } from 'src/loan-application/loan-application.module';
import { LoanEligibilityModule } from 'src/loan-eligibility/loan-eligibility.module';
import { NotificationModule } from 'src/notification/notification.module';
import { UserModule } from 'src/user/user.module';
import { LoanCartModule } from 'src/loan-cart/loan-cart.module';

@Module({
  imports: [
    PrismaModule,
    LoanApplicationModule,
    LoanEligibilityModule,
    NotificationModule,
    UserModule,
    LoanCartModule,
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
