import { Module } from '@nestjs/common';
import { FarmController } from './farm.controller';
import { FarmService } from './farm.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [PrismaModule, FileModule],
  controllers: [FarmController],
  providers: [FarmService],
  exports: [FarmService],
})
export class FarmModule {}
