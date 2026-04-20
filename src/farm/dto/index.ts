import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FARM_OWNERSHIP_TYPE } from '@prisma/client';

export class CreateFarmDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lga: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ward?: string;

  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sizeValue: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sizeUnit: string;

  @ApiProperty({ enum: FARM_OWNERSHIP_TYPE })
  @IsEnum(FARM_OWNERSHIP_TYPE)
  ownershipType: FARM_OWNERSHIP_TYPE;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mainCropType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  secondaryCropType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  farmingSeason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedPlantingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasIrrigation?: boolean;
}

export class UpdateFarmDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lga?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ward?: string;

  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sizeValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sizeUnit?: string;

  @ApiPropertyOptional({ enum: FARM_OWNERSHIP_TYPE })
  @IsOptional()
  @IsEnum(FARM_OWNERSHIP_TYPE)
  ownershipType?: FARM_OWNERSHIP_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mainCropType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  secondaryCropType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  farmingSeason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedPlantingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasIrrigation?: boolean;
}
