import {
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto, UpdateWarehouseDto, GetClosestWarehouseQueryDto } from './dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { warehouseResponse } from './warehouse.response';

@ApiTags('Warehouses')
@Controller('v1/warehouses')
export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Create a new warehouse (Admin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, example: warehouseResponse.createWarehouse })
  async createWarehouse(@Body() body: CreateWarehouseDto) {
    return this.service.createWarehouse(body);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all warehouses' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, example: warehouseResponse.getAllWarehouses })
  async getAllWarehouses(@Query('activeOnly') activeOnly?: boolean) {
    return this.service.getAllWarehouses(activeOnly);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get warehouse by ID' })
  @ApiResponse({ status: HttpStatus.OK, example: warehouseResponse.getWarehouse })
  async getWarehouse(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getWarehouse(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Update warehouse (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, example: warehouseResponse.updateWarehouse })
  async updateWarehouse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateWarehouseDto,
  ) {
    return this.service.updateWarehouse(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Delete warehouse (Admin only)' })
  async deleteWarehouse(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteWarehouse(id);
  }

  @Get('closest-to-farm/:farmId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get closest warehouses to a farm location' })
  @ApiResponse({ status: HttpStatus.OK, example: warehouseResponse.getClosestWarehouse })
  async getClosestWarehouses(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Query() query: GetClosestWarehouseQueryDto,
  ) {
    return this.service.getClosestWarehouses(farmId, query.limit ?? 5);
  }
}
