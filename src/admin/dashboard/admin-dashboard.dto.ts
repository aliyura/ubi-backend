import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BILL_TYPE, TRANSACTION_CATEGORY, TRANSACTION_TYPE } from '@prisma/client';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Start date in YYYY-MM-DD format',
  })
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'End date in YYYY-MM-DD format',
  })
  toDate?: string;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 20, description: 'Number of results per page' })
  limit?: number = 20;
}

export class AccountRegistryQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by account number, BVN, or customer name',
    example: '0123456789',
  })
  search?: string;
}

export class TransactionsHistoryQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by transaction reference',
    example: 'TXN-20260428-001',
  })
  reference?: string;

  @IsOptional()
  @IsEnum(TRANSACTION_TYPE)
  @ApiPropertyOptional({
    enum: TRANSACTION_TYPE,
    description: 'Filter by transaction type',
    example: TRANSACTION_TYPE.DEBIT,
  })
  type?: TRANSACTION_TYPE;

  @IsOptional()
  @IsEnum(TRANSACTION_CATEGORY)
  @ApiPropertyOptional({
    enum: TRANSACTION_CATEGORY,
    description: 'Filter by transaction category',
    example: TRANSACTION_CATEGORY.TRANSFER,
  })
  category?: TRANSACTION_CATEGORY;

  @IsOptional()
  @IsEnum(BILL_TYPE)
  @ApiPropertyOptional({
    enum: BILL_TYPE,
    description: 'Filter by bill type (only applies to bill payment transactions)',
    example: BILL_TYPE.airtime,
  })
  billType?: BILL_TYPE;
}

export class ActiveWalletsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by account number, customer name, or user ID',
    example: '0123456789',
  })
  search?: string;
}

export class TransferPipelineQueryDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2026-04-29',
    description: 'Filter transfers by date (YYYY-MM-DD)',
  })
  date?: string;
}

export class KycActivePipelineQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by customer name, BVN, or email',
    example: 'Amara',
  })
  search?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Filter by registration date from (YYYY-MM-DD)',
  })
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Filter by registration date to (YYYY-MM-DD)',
  })
  toDate?: string;
}

export class DisputesPipelineQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by ref number or ticket title',
    example: 'SCM-001',
  })
  search?: string;
}
