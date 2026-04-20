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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MarketplaceOrderAdminService } from './marketplace-order-admin.service';
import {
  AdminCancelOrderDto,
  AdminConfirmOrderDto,
  AdminDeliverOrderDto,
  AdminDispatchOrderDto,
  QueryMarketplaceOrderDto,
} from './dto';

@ApiTags('Admin — Marketplace Orders')
@Controller('v1/admin/marketplace-orders')
export class MarketplaceOrderAdminController {
  constructor(private readonly service: MarketplaceOrderAdminService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all marketplace orders' })
  listOrders(@Query() query: QueryMarketplaceOrderDto) {
    return this.service.listOrders(query);
  }

  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full marketplace order detail' })
  getOrderDetail(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.service.getOrderDetail(orderId);
  }

  @Post(':orderId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm order and deduct stock from inventory' })
  confirmOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: AdminConfirmOrderDto,
    @Req() req: Request,
  ) {
    return this.service.confirmOrder(orderId, body, (req as any).user);
  }

  @Post(':orderId/pack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark order as packed' })
  packOrder(@Param('orderId', ParseUUIDPipe) orderId: string, @Req() req: Request) {
    return this.service.packOrder(orderId, (req as any).user);
  }

  @Post(':orderId/dispatch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark order as dispatched' })
  dispatchOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: AdminDispatchOrderDto,
    @Req() req: Request,
  ) {
    return this.service.dispatchOrder(orderId, body, (req as any).user);
  }

  @Post(':orderId/deliver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record delivery and upload proof' })
  deliverOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: AdminDeliverOrderDto,
    @Req() req: Request,
  ) {
    return this.service.deliverOrder(orderId, body, (req as any).user);
  }

  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin cancel order (re-credits stock if confirmed)' })
  cancelOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: AdminCancelOrderDto,
    @Req() req: Request,
  ) {
    return this.service.cancelOrder(orderId, body, (req as any).user);
  }
}
