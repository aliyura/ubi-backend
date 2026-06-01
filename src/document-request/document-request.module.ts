import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileModule } from 'src/file/file.module';
import { NotificationModule } from 'src/notification/notification.module';
import { DocumentRequestService } from './document-request.service';
import {
  AdminDocumentRequestController,
  UserDocumentRequestController,
} from './document-request.controller';

@Module({
  imports: [PrismaModule, FileModule, NotificationModule],
  controllers: [AdminDocumentRequestController, UserDocumentRequestController],
  providers: [DocumentRequestService],
  exports: [DocumentRequestService],
})
export class DocumentRequestModule {}
