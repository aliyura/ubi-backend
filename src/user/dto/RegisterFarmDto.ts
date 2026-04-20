import { FARM_OWNERSHIP_TYPE } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterFarmDto {
  @ApiProperty({ example: 'Green Acres Farm' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '12 Farm Road, Kano' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'Kano' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: 'Kano Municipal' })
  @IsNotEmpty()
  @IsString()
  lga: string;

  @ApiProperty({ enum: FARM_OWNERSHIP_TYPE, example: FARM_OWNERSHIP_TYPE.owned })
  @IsEnum(FARM_OWNERSHIP_TYPE)
  ownershipType: FARM_OWNERSHIP_TYPE;

  @ApiProperty({ example: 'Maize' })
  @IsNotEmpty()
  @IsString()
  mainCropType: string;

  @ApiPropertyOptional({ example: 'Ward 3' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: 11.9964 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 8.5172 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ example: 5.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sizeValue?: number;

  @ApiPropertyOptional({ example: 'hectares' })
  @IsOptional()
  @IsString()
  sizeUnit?: string;

  @ApiPropertyOptional({ example: 'Rice' })
  @IsOptional()
  @IsString()
  secondaryCropType?: string;

  @ApiPropertyOptional({ example: 'Wet season' })
  @IsOptional()
  @IsString()
  farmingSeason?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  expectedPlantingDate?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  expectedHarvestDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasIrrigation?: boolean;
}
