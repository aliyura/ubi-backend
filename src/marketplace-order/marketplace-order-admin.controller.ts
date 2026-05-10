import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MarketplaceOrderAdminService } from './marketplace-order-admin.service';
import {
  AdminCancelOrderDto,
  AdminConfirmOrderDto,
  AdminDeliverOrderDto,
  AdminDispatchOrderDto,
  QueryMarketplaceOrderDto,
} from './dto';
import { marketplaceOrderAdminResponse } from './marketplace-order-admin.response';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';

@ApiTags('Admin — Marketplace Orders')
@Controller('v1/admin/marketplace-orders')
@UseGuards(RolesGuard)
export class MarketplaceOrderAdminController {
  constructor(private readonly service: MarketplaceOrderAdminService) {}

  @Get()
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all marketplace orders' })
  @ApiResponse({ status: HttpStatus.OK, example: marketplaceOrderAdminResponse.listOrders })
  listOrders(@Query() query: QueryMarketplaceOrderDto) {
    return this.service.listOrders(query);
  }

  @Get(':orderId')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full marketplace order detail' })
  @ApiResponse({ status: HttpStatus.OK, example: marketplaceOrderAdminResponse.getOrderDetail })
  getOrderDetail(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.service.getOrderDetail(orderId);
  }

  @Post(':orderId/confirm')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm order and deduct stock from inventory' })
  @ApiResponse({ status: HttpStatus.OK, example: marketplaceOrderAdminResponse.confirmOrder })
  confirmOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: AdminConfirmOrderDto,
    @Req() req: Request,
  ) {
    return this.service.confirmOrder(orderId, body, (req as any).user);
  }

  @Post(':orderId/pack')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark order as packed' })
  @ApiResponse({ status: HttpStatus.OK, example: marketplaceOrderAdminResponse.packOrder })
  packOrder(@Param('orderId', ParseUUIDPipe) orderId: string, @Req() req: Request) {
    return this.service.packOrder(orderId, (req as any).user);
  }

  @Post(':orderId/dispatch')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark order as dispatched' })
  @ApiResponse({ status: HttpStatus.OK, example: marketplaceOrderAdminResponse.dispatchOrder })
  dispatchOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: AdminDispatchOrderDto,
    @Req() req: Request,
  ) {
    return this.service.dispatchOrder(orderId, body, (req as any).user);
  }

  @Post(':orderId/deliver')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record delivery and upload proof' })
  @ApiResponse({ status: HttpStatus.OK, example: marketplaceOrderAdminResponse.deliverOrder })
  deliverOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: AdminDeliverOrderDto,
    @Req() req: Request,
  ) {
    return this.service.deliverOrder(orderId, body, (req as any).user);
  }

  @Post(':orderId/cancel')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin cancel order (re-credits stock if confirmed)' })
  @ApiResponse({ status: HttpStatus.OK, example: marketplaceOrderAdminResponse.cancelOrder })
  cancelOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: AdminCancelOrderDto,
    @Req() req: Request,
  ) {
    return this.service.cancelOrder(orderId, body, (req as any).user);
  }
}
