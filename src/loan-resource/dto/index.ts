import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateResourceCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateLoanResourceDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unitOfMeasure: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  suitableCrops?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEligibleForLoan?: boolean;
}

export class UpdateLoanResourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitOfMeasure?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  suitableCrops?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEligibleForLoan?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QueryLoanResourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}
