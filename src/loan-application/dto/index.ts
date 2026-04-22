import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FULFILLMENT_METHOD, LOAN_APPLICATION_STATUS } from '@prisma/client';

export class CreateLoanApplicationDto {
  @ApiProperty()
  @IsUUID()
  farmId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedPlantingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @ApiPropertyOptional({ enum: FULFILLMENT_METHOD })
  @IsOptional()
  @IsEnum(FULFILLMENT_METHOD)
  fulfillmentMethod?: FULFILLMENT_METHOD;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deliveryContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  farmerNotes?: string;

  @ApiPropertyOptional({ type: [Boolean] })
  @IsOptional()
  @IsArray()
  @IsBoolean({ each: true })
  declarations?: boolean[];
}

export class QueryLoanApplicationDto {
  @ApiPropertyOptional({ enum: LOAN_APPLICATION_STATUS })
  @IsOptional()
  @IsEnum(LOAN_APPLICATION_STATUS)
  status?: LOAN_APPLICATION_STATUS;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
