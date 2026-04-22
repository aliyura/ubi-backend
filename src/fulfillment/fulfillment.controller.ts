import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FulfillmentService } from './fulfillment.service';
import {
  CreateFulfillmentDto,
  CreateSupplierDto,
  DeliverFulfillmentDto,
} from './dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { fulfillmentResponse } from './fulfillment.response';

@ApiTags('Admin - Fulfillment')
@Controller('v1/admin')
@UseGuards(RolesGuard)
@Roles(USER_ROLE.ADMIN)
export class FulfillmentController {
  constructor(private readonly service: FulfillmentService) {}

  @Get('fulfillments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all fulfillments' })
  @ApiResponse({ status: HttpStatus.OK, example: fulfillmentResponse.listFulfillments })
  async list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.listFulfillments(page, limit);
  }

  @Post('loan-applications/:id/fulfillment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create fulfillment for an approved application' })
  @ApiResponse({ status: HttpStatus.CREATED, example: fulfillmentResponse.createFulfillment })
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateFulfillmentDto,
    @Req() req: Request,
  ) {
    return this.service.createFulfillment(id, body, (req as any).user);
  }

  @Post('fulfillments/:id/dispatch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark fulfillment as dispatched (ReadyForPickup or OutForDelivery)' })
  @ApiResponse({ status: HttpStatus.OK, example: fulfillmentResponse.dispatch })
  async dispatch(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.service.dispatch(id, (req as any).user);
  }

  @Post('fulfillments/:id/deliver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm delivery and upload proof' })
  @ApiResponse({ status: HttpStatus.OK, example: fulfillmentResponse.deliver })
  async deliver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DeliverFulfillmentDto,
    @Req() req: Request,
  ) {
    return this.service.deliver(id, body, (req as any).user);
  }

  @Get('suppliers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all active suppliers' })
  @ApiResponse({ status: HttpStatus.OK, example: fulfillmentResponse.listSuppliers })
  async listSuppliers() {
    return this.service.listSuppliers();
  }

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: HttpStatus.CREATED, example: fulfillmentResponse.createSupplier })
  async createSupplier(@Body() body: CreateSupplierDto) {
    return this.service.createSupplier(body);
  }
}
