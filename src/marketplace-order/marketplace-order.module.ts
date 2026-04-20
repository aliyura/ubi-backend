import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanApplicationModule } from 'src/loan-application/loan-application.module';
import { MarketplaceOrderController } from './marketplace-order.controller';
import { MarketplaceOrderAdminController } from './marketplace-order-admin.controller';
import { MarketplaceOrderService } from './marketplace-order.service';
import { MarketplaceOrderAdminService } from './marketplace-order-admin.service';

@Module({
  imports: [PrismaModule, LoanApplicationModule],
  controllers: [MarketplaceOrderController, MarketplaceOrderAdminController],
  providers: [MarketplaceOrderService, MarketplaceOrderAdminService],
})
export class MarketplaceOrderModule {}
