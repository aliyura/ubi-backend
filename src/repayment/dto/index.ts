import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LOAN_APPLICATION_STATUS } from '@prisma/client';

export class RecordRepaymentDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amountPaid: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AgentRepaymentQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by specific farmer ID' })
  @IsOptional()
  @IsUUID()
  farmerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by loan application status',
    enum: LOAN_APPLICATION_STATUS,
  })
  @IsOptional()
  @IsEnum(LOAN_APPLICATION_STATUS)
  loanStatus?: LOAN_APPLICATION_STATUS;

  @ApiPropertyOptional({ description: 'Filter by repayment plan status' })
  @IsOptional()
  @IsString()
  repaymentPlanStatus?: string;
}
