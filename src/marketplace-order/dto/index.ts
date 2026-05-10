import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsNotEmpty,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FULFILLMENT_METHOD, MARKETPLACE_ORDER_STATUS } from '@prisma/client';

export enum MARKETPLACE_PAYMENT_METHOD {
  credit = 'credit',
  transfer = 'transfer',
  card = 'card',
}

export class MarketplaceOrderItemDto {
  @ApiProperty()
  @IsUUID()
  resourceId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number;
}

export class PlaceMarketplaceOrderDto {
  @ApiProperty({ type: [MarketplaceOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MarketplaceOrderItemDto)
  items: MarketplaceOrderItemDto[];

  @ApiPropertyOptional({
    enum: MARKETPLACE_PAYMENT_METHOD,
    default: MARKETPLACE_PAYMENT_METHOD.credit,
  })
  @IsOptional()
  @IsEnum(MARKETPLACE_PAYMENT_METHOD)
  paymentMethod?: MARKETPLACE_PAYMENT_METHOD;

  @ApiPropertyOptional({ enum: FULFILLMENT_METHOD })
  @IsOptional()
  @IsEnum(FULFILLMENT_METHOD)
  deliveryMethod?: FULFILLMENT_METHOD;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupAddress?: string;
}

export class QueryMarketplaceOrderDto {
  @ApiPropertyOptional({ enum: MARKETPLACE_ORDER_STATUS })
  @IsOptional()
  @IsEnum(MARKETPLACE_ORDER_STATUS)
  status?: MARKETPLACE_ORDER_STATUS;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class AdminConfirmOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class AdminDispatchOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class AdminDeliverOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receivedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryProofUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryNote?: string;
}

export class AdminCancelOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cancelReason: string;
}
