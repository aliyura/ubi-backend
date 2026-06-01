import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { Request } from 'express';
import { multerOptions } from 'src/config/multer.config';
import { DocumentRequestService } from './document-request.service';
import {
  AdminQueryDocumentRequestDto,
  CreateDocumentRequestDto,
  ReviewDocumentRequestDto,
  UserQueryDocumentRequestDto,
} from './dto';

// ─── Admin endpoints ─────────────────────────────────────────────────────────

@Controller('v1/admin/document-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
@ApiBearerAuth()
export class AdminDocumentRequestController {
  constructor(private readonly service: DocumentRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a document from a user/agent/farmer' })
  async createRequest(
    @Body() body: CreateDocumentRequestDto,
    @Req() req: Request,
  ) {
    return this.service.createRequest(body, (req as any).user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all document requests' })
  async listRequests(@Query() query: AdminQueryDocumentRequestDto) {
    return this.service.listRequests(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single document request' })
  async getRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getRequest(id);
  }

  @Patch(':id/review')
  @HttpCode(HttpStatus.OK)
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Approve or reject an uploaded document' })
  async reviewRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReviewDocumentRequestDto,
    @Req() req: Request,
  ) {
    return this.service.reviewRequest(id, body, (req as any).user);
  }
}

// ─── User-facing endpoints ────────────────────────────────────────────────────

@Controller('v1/user/document-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserDocumentRequestController {
  constructor(private readonly service: DocumentRequestService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List my document requests' })
  async getMyRequests(
    @Query() query: UserQueryDocumentRequestDto,
    @Req() req: Request,
  ) {
    return this.service.getUserRequests((req as any).user, query);
  }

  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('document', multerOptions('document-request')),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['document'],
      properties: {
        document: { type: 'string', format: 'binary' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload a document in response to a document request',
  })
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.service.uploadDocument(id, file, (req as any).user);
  }
}
