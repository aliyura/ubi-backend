import { Module } from '@nestjs/common';
import { FulfillmentController } from './fulfillment.controller';
import { FulfillmentService } from './fulfillment.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanApplicationModule } from 'src/loan-application/loan-application.module';

@Module({
  imports: [PrismaModule, LoanApplicationModule],
  controllers: [FulfillmentController],
  providers: [FulfillmentService],
})
export class FulfillmentModule {}
