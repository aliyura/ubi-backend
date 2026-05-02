import { Module } from '@nestjs/common';
import { LoanApplicationController } from './loan-application.controller';
import { LoanApplicationService } from './loan-application.service';
import { LoanNotificationService } from './loan-notification.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanEligibilityModule } from 'src/loan-eligibility/loan-eligibility.module';
import { ApiProvidersModule } from 'src/api-providers/api-providers.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [PrismaModule, LoanEligibilityModule, ApiProvidersModule, NotificationModule],
  controllers: [LoanApplicationController],
  providers: [LoanApplicationService, LoanNotificationService],
  exports: [LoanApplicationService, LoanNotificationService],
})
export class LoanApplicationModule {}
