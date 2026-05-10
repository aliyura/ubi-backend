import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanApplicationModule } from 'src/loan-application/loan-application.module';
import { NotificationModule } from 'src/notification/notification.module';
import { ApiProvidersModule } from 'src/api-providers/api-providers.module';
import { MarketplaceOrderController } from './marketplace-order.controller';
import { MarketplaceOrderAdminController } from './marketplace-order-admin.controller';
import { MarketplaceOrderService } from './marketplace-order.service';
import { MarketplaceOrderAdminService } from './marketplace-order-admin.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoanApplicationModule,
    NotificationModule,
    ApiProvidersModule,
  ],
  controllers: [MarketplaceOrderController, MarketplaceOrderAdminController],
  providers: [MarketplaceOrderService, MarketplaceOrderAdminService],
})
export class MarketplaceOrderModule {}
