import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export enum StatementSection {
  ALL = 'all',
  TRANSACTIONS = 'transactions',
  LOANS = 'loans',
  REPAYMENTS = 'repayments',
}

export class StatementQueryDto {
  @ApiProperty({
    example: '2025-01-01',
    description: 'Start of statement period (ISO date)',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2025-01-31',
    description: 'End of statement period (ISO date)',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    enum: StatementSection,
    default: StatementSection.ALL,
    description: 'Section of data to include',
  })
  @IsOptional()
  @IsEnum(StatementSection)
  section?: StatementSection;

  @ApiPropertyOptional({
    example: true,
    description:
      'When true, emails the statement to the logged-in user instead of downloading',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  email?: boolean;
}
