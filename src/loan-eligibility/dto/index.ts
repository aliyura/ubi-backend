import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FULFILLMENT_METHOD } from '@prisma/client';

export class EligibilityCheckDto {
  @ApiProperty()
  @IsString()
  farmId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plantingDate?: string;

  @ApiPropertyOptional({ enum: FULFILLMENT_METHOD })
  @IsOptional()
  @IsEnum(FULFILLMENT_METHOD)
  fulfillmentMethod?: FULFILLMENT_METHOD;
}
