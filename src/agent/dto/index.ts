import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AGENT_RECOMMENDATION_TYPE } from '@prisma/client';

export const AGENT_ACTION = {
  LOGIN:                      'LOGIN',
  VIEW_ASSIGNED_APPLICATIONS: 'VIEW_ASSIGNED_APPLICATIONS',
  SUBMIT_FIELD_VERIFICATION:  'SUBMIT_FIELD_VERIFICATION',
} as const;

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

export class GetActivityLogsDto {
  @ApiPropertyOptional({ description: 'ISO date — start of range (inclusive)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date — end of range (inclusive)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Admin only: filter by agent UUID' })
  @IsOptional()
  @IsUUID()
  agentId?: string;
}
