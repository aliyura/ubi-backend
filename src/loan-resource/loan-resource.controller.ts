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
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoanResourceService } from './loan-resource.service';
import {
  CreateLoanResourceDto,
  CreateResourceCategoryDto,
  QueryLoanResourceDto,
  UpdateLoanResourceDto,
} from './dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { loanResourceResponse } from './loan-resource.response';

@ApiTags('Loan Resources')
@Controller('v1')
export class LoanResourceController {
  constructor(private readonly service: LoanResourceService) {}

  @Get('loan-resource-categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all resource categories' })
  @ApiResponse({ status: HttpStatus.OK, example: loanResourceResponse.getCategories })
  async getCategories() {
    return this.service.getCategories();
  }

  @Post('admin/loan-resource-categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a resource category (admin)' })
  @ApiResponse({ status: HttpStatus.CREATED, example: loanResourceResponse.createCategory })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  async createCategory(@Body() body: CreateResourceCategoryDto) {
    return this.service.createCategory(body);
  }

  @Get('loan-resources')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List loan resources' })
  @ApiResponse({ status: HttpStatus.OK, example: loanResourceResponse.getResources })
  async getResources(@Query() query: QueryLoanResourceDto) {
    return this.service.getResources(query);
  }

  @Get('loan-resources/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single loan resource' })
  @ApiResponse({ status: HttpStatus.OK, example: loanResourceResponse.getResource })
  async getResource(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getResource(id);
  }

  @Post('admin/loan-resources')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a loan resource (admin)' })
  @ApiResponse({ status: HttpStatus.CREATED, example: loanResourceResponse.createResource })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  async createResource(@Body() body: CreateLoanResourceDto) {
    return this.service.createResource(body);
  }

  @Patch('admin/loan-resources/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a loan resource (admin)' })
  @ApiResponse({ status: HttpStatus.OK, example: loanResourceResponse.updateResource })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  async updateResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLoanResourceDto,
  ) {
    return this.service.updateResource(id, body);
  }
}
