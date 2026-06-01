import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileService } from 'src/file/file.service';
import { NotificationService } from 'src/notification/notification.service';
import { DOCUMENT_REQUEST_UPLOAD_FOLDER_NAME } from 'src/constants';
import { NOTIFICATION_TYPE, User } from '@prisma/client';
import {
  AdminQueryDocumentRequestDto,
  CreateDocumentRequestDto,
  ReviewDocumentRequestDto,
  UserQueryDocumentRequestDto,
} from './dto';

@Injectable()
export class DocumentRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly notificationService: NotificationService,
  ) {}

  async createRequest(body: CreateDocumentRequestDto, admin: User) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, fullname: true },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    if (body.loanApplicationId) {
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: body.loanApplicationId },
      });
      if (!loan) throw new NotFoundException('Loan application not found');
    }

    const request = await this.prisma.documentRequest.create({
      data: {
        userId: body.userId,
        requestedById: admin.id,
        documentName: body.documentName,
        description: body.description,
        loanApplicationId: body.loanApplicationId,
      },
    });

    await this.notificationService.create({
      userId: body.userId,
      type: NOTIFICATION_TYPE.DOCUMENT_REQUESTED,
      title: 'Document Requested',
      message: `Your account manager has requested: ${body.documentName}${body.description ? `. ${body.description}` : ''}`,
      resourceId: request.id,
      resourceType: 'DocumentRequest',
    });

    return {
      message: 'Document request created successfully',
      statusCode: 201,
      data: request,
    };
  }

  async listRequests(query: AdminQueryDocumentRequestDto) {
    const { userId, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.documentRequest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullname: true,
              email: true,
              phoneNumber: true,
              role: true,
            },
          },
          requestedBy: { select: { id: true, fullname: true, email: true } },
          loanApplication: { select: { id: true, applicationRef: true } },
        },
      }),
      this.prisma.documentRequest.count({ where }),
    ]);

    return {
      message: 'Document requests retrieved',
      statusCode: 200,
      data,
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async getRequest(id: string) {
    const request = await this.prisma.documentRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
        requestedBy: { select: { id: true, fullname: true, email: true } },
        loanApplication: { select: { id: true, applicationRef: true } },
      },
    });
    if (!request) throw new NotFoundException('Document request not found');

    return { message: 'Document request retrieved', statusCode: 200, data: request };
  }

  async reviewRequest(id: string, body: ReviewDocumentRequestDto, admin: User) {
    const request = await this.prisma.documentRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Document request not found');

    if (request.status !== 'uploaded') {
      throw new BadRequestException(
        'Only uploaded documents can be reviewed',
      );
    }

    const updated = await this.prisma.documentRequest.update({
      where: { id },
      data: { status: body.status, reviewNote: body.reviewNote },
    });

    const notifType =
      body.status === 'approved'
        ? NOTIFICATION_TYPE.DOCUMENT_APPROVED
        : NOTIFICATION_TYPE.DOCUMENT_REJECTED;

    await this.notificationService.create({
      userId: request.userId,
      type: notifType,
      title:
        body.status === 'approved' ? 'Document Approved' : 'Document Rejected',
      message:
        body.status === 'approved'
          ? `Your document "${request.documentName}" has been approved.`
          : `Your document "${request.documentName}" was rejected.${body.reviewNote ? ` Reason: ${body.reviewNote}` : ''}`,
      resourceId: request.id,
      resourceType: 'DocumentRequest',
    });

    return {
      message: `Document ${body.status}`,
      statusCode: 200,
      data: updated,
    };
  }

  async getUserRequests(user: User, query: UserQueryDocumentRequestDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: user.id };
    if (status) where.status = status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.documentRequest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          documentName: true,
          description: true,
          status: true,
          fileUrl: true,
          fileName: true,
          reviewNote: true,
          loanApplicationId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.documentRequest.count({ where }),
    ]);

    return {
      message: 'Document requests retrieved',
      statusCode: 200,
      data,
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async uploadDocument(
    id: string,
    file: Express.Multer.File,
    user: User,
  ) {
    const request = await this.prisma.documentRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Document request not found');
    if (request.userId !== user.id)
      throw new BadRequestException('This document request does not belong to you');
    if (request.status === 'approved')
      throw new BadRequestException('This document has already been approved');
    if (!file) throw new BadRequestException('Document file is required');

    const uploadResponse = await this.fileService.uploadFile(file, {
      folder: DOCUMENT_REQUEST_UPLOAD_FOLDER_NAME,
      prefix: `${user.id}_${id}`,
    });

    if (!uploadResponse.success || !uploadResponse.data)
      throw new BadRequestException(
        uploadResponse.message || 'Unable to upload document',
      );

    const updated = await this.prisma.documentRequest.update({
      where: { id },
      data: {
        status: 'uploaded',
        fileUrl: uploadResponse.data.url,
        fileName: uploadResponse.data.fileName,
      },
    });

    await this.notificationService.notifyAdmins({
      type: NOTIFICATION_TYPE.NEW_DOCUMENT_UPLOADED,
      title: 'Document Uploaded',
      message: `A user has uploaded a document: "${request.documentName}"`,
      resourceId: request.id,
      resourceType: 'DocumentRequest',
    });

    return {
      message: 'Document uploaded successfully',
      statusCode: 200,
      data: updated,
    };
  }
}
