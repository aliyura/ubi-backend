import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsInt,
  IsUUID,
  IsNotEmpty,
  IsDateString,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LOAN_APPLICATION_STATUS, LOAN_DECISION_TYPE } from '@prisma/client';

export class ApprovedItemDto {
  @ApiProperty()
  @IsUUID()
  applicationItemId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  approvedQuantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  approvedAmount: number;
}

export class RepaymentTermsDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  numberOfInstallments: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty()
  @IsDateString()
  firstDueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  serviceCharge?: number;
}

export class AdminDecisionDto {
  @ApiProperty({ enum: LOAN_DECISION_TYPE })
  @IsEnum(LOAN_DECISION_TYPE)
  decision: LOAN_DECISION_TYPE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  approvedTotalValue?: number;

  @ApiPropertyOptional({ type: [ApprovedItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovedItemDto)
  approvedItems?: ApprovedItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => RepaymentTermsDto)
  repaymentTerms?: RepaymentTermsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

export class AssignAgentDto {
  @ApiProperty()
  @IsUUID()
  agentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ManualStatusDto {
  @ApiProperty({ enum: LOAN_APPLICATION_STATUS })
  @IsEnum(LOAN_APPLICATION_STATUS)
  status: LOAN_APPLICATION_STATUS;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminQueryAgentsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

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

export class AdminQueryLoanDto {
  @ApiPropertyOptional({ enum: LOAN_APPLICATION_STATUS })
  @IsOptional()
  @IsEnum(LOAN_APPLICATION_STATUS)
  status?: LOAN_APPLICATION_STATUS;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agentId?: string;

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
