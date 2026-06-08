import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { ApiProvidersModule } from 'src/api-providers/api-providers.module';
import { FarmModule } from 'src/farm/farm.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ApiProvidersModule, FarmModule, PrismaModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
