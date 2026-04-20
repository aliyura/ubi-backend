import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AGENT_RECOMMENDATION_TYPE } from '@prisma/client';

export class SubmitVerificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  farmExists?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  visitedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cropConfirmed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedFarmSize?: number;

  @ApiProperty({ enum: AGENT_RECOMMENDATION_TYPE })
  @IsEnum(AGENT_RECOMMENDATION_TYPE)
  recommendation: AGENT_RECOMMENDATION_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  photos?: string[];
}
