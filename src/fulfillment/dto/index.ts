import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
  IsNotEmpty,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FULFILLMENT_METHOD } from '@prisma/client';

export class FulfillmentItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unitOfMeasure: string;
}

export class CreateFulfillmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fulfillmentRef?: string;

  @ApiPropertyOptional({ enum: FULFILLMENT_METHOD })
  @IsOptional()
  @IsEnum(FULFILLMENT_METHOD)
  deliveryMethod?: FULFILLMENT_METHOD;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryOfficer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryPhone?: string;

  @ApiPropertyOptional({ type: [FulfillmentItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FulfillmentItemDto)
  items?: FulfillmentItemDto[];
}

export class DeliverFulfillmentDto {
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

export class CreateSupplierDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryCoverage?: string;
}
