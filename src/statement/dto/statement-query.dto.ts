import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export enum StatementSection {
  ALL = 'all',
  TRANSACTIONS = 'transactions',
  LOANS = 'loans',
  REPAYMENTS = 'repayments',
}

export class StatementQueryDto {
  @ApiProperty({ example: '2025-01-01', description: 'Start of statement period (ISO date)' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-01-31', description: 'End of statement period (ISO date)' })
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
}
