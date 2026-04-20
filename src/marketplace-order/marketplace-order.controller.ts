import {
  Body,
  Controller,
  Delete,
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
import { MarketplaceOrderService } from './marketplace-order.service';
import { PlaceMarketplaceOrderDto, QueryMarketplaceOrderDto } from './dto';

@ApiTags('Marketplace Orders')
@Controller('v1/loan-applications/:applicationId/marketplace-orders')
export class MarketplaceOrderController {
  constructor(private readonly service: MarketplaceOrderService) {}

  @Get('credit-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get approved credit, total spent, and remaining balance' })
  getCreditSummary(@Param('applicationId', ParseUUIDPipe) applicationId: string, @Req() req: Request) {
    return this.service.getCreditSummary(applicationId, (req as any).user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a marketplace order using approved loan credit' })
  placeOrder(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() body: PlaceMarketplaceOrderDto,
    @Req() req: Request,
  ) {
    return this.service.placeOrder(applicationId, body, (req as any).user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List my marketplace orders for this application' })
  listMyOrders(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Query() query: QueryMarketplaceOrderDto,
    @Req() req: Request,
  ) {
    return this.service.listMyOrders(applicationId, (req as any).user, query);
  }

  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single marketplace order detail' })
  getMyOrder(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Req() req: Request,
  ) {
    return this.service.getMyOrder(applicationId, orderId, (req as any).user);
  }

  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending marketplace order' })
  cancelMyOrder(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Req() req: Request,
  ) {
    return this.service.cancelMyOrder(applicationId, orderId, (req as any).user);
  }
}
