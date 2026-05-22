import { Module } from '@nestjs/common';
import { LoanResourceController } from './loan-resource.controller';
import { LoanResourceService } from './loan-resource.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [PrismaModule, FileModule],
  controllers: [LoanResourceController],
  providers: [LoanResourceService],
  exports: [LoanResourceService],
})
export class LoanResourceModule {}
