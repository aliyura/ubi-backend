import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { LoanResourceService } from './loan-resource.service';
import {
  CreateLoanResourceDto,
  CreateResourceCategoryDto,
  QueryLoanResourceDto,
  UpdateLoanResourceDto,
  UpdateResourceCategoryDto,
} from './dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { loanResourceResponse } from './loan-resource.response';
import { FileService } from 'src/file/file.service';

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
};

@ApiTags('Loan Resources')
@Controller('v1')
export class LoanResourceController {
  constructor(
    private readonly service: LoanResourceService,
    private readonly fileService: FileService,
  ) {}

  @Get('loan-resource-categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all resource categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanResourceResponse.getCategories,
  })
  async getCategories() {
    return this.service.getCategories();
  }

  @Post('admin/loan-resource-categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a resource category (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateResourceCategoryDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: loanResourceResponse.createCategory,
  })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async createCategory(
    @Body() body: CreateResourceCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) {
      const uploaded = await this.fileService.uploadFile(image, {
        folder: 'loan-resource-categories',
      });
      if (!uploaded.success) throw new BadRequestException(uploaded.message);
      body.imageUrl = uploaded.data.url;
    }
    return this.service.createCategory(body);
  }

  @Get('admin/loan-resource-categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all resource categories including inactive (admin)' })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  async adminGetCategories() {
    return this.service.adminGetCategories();
  }

  @Patch('admin/loan-resource-categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a resource category (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateResourceCategoryDto })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateResourceCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) {
      const uploaded = await this.fileService.uploadFile(image, {
        folder: 'loan-resource-categories',
      });
      if (!uploaded.success) throw new BadRequestException(uploaded.message);
      body.imageUrl = uploaded.data.url;
    }
    return this.service.updateCategory(id, body);
  }

  @Delete('admin/loan-resource-categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a resource category (admin)' })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  async deactivateCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivateCategory(id);
  }

  @Get('admin/loan-resources')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all loan resources including inactive (admin)' })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  async adminGetResources(@Query() query: QueryLoanResourceDto) {
    return this.service.adminGetResources(query);
  }

  @Get('loan-resources')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List loan resources' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanResourceResponse.getResources,
  })
  async getResources(@Query() query: QueryLoanResourceDto) {
    return this.service.getResources(query);
  }

  @Get('loan-resources/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single loan resource' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanResourceResponse.getResource,
  })
  async getResource(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getResource(id);
  }

  @Post('admin/loan-resources')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a loan resource (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateLoanResourceDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: loanResourceResponse.createResource,
  })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async createResource(
    @Body() body: CreateLoanResourceDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) {
      const uploaded = await this.fileService.uploadFile(image, {
        folder: 'loan-resources',
      });
      if (!uploaded.success) throw new BadRequestException(uploaded.message);
      body.imageUrl = uploaded.data.url;
    }
    return this.service.createResource(body);
  }

  @Patch('admin/loan-resources/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a loan resource (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateLoanResourceDto })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanResourceResponse.updateResource,
  })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async updateResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLoanResourceDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) {
      const uploaded = await this.fileService.uploadFile(image, {
        folder: 'loan-resources',
      });
      if (!uploaded.success) throw new BadRequestException(uploaded.message);
      body.imageUrl = uploaded.data.url;
    }
    return this.service.updateResource(id, body);
  }
}
