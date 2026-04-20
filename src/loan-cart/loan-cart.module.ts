import { Module } from '@nestjs/common';
import { LoanCartController } from './loan-cart.controller';
import { LoanCartService } from './loan-cart.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoanCartController],
  providers: [LoanCartService],
  exports: [LoanCartService],
})
export class LoanCartModule {}
