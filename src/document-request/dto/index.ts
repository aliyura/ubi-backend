import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DOCUMENT_REQUEST_STATUS } from '@prisma/client';

export class CreateDocumentRequestDto {
  @ApiProperty({ description: 'ID of the user/agent/farmer to request from' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'Proof of Land Ownership' })
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @ApiPropertyOptional({
    example: 'Please provide a certified copy from the land registry',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Link this request to a loan application' })
  @IsOptional()
  @IsUUID()
  loanApplicationId?: string;
}

export class ReviewDocumentRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class AdminQueryDocumentRequestDto {
  @ApiPropertyOptional({ description: 'Filter by userId' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: DOCUMENT_REQUEST_STATUS })
  @IsOptional()
  @IsEnum(DOCUMENT_REQUEST_STATUS)
  status?: DOCUMENT_REQUEST_STATUS;

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

export class UserQueryDocumentRequestDto {
  @ApiPropertyOptional({ enum: DOCUMENT_REQUEST_STATUS })
  @IsOptional()
  @IsEnum(DOCUMENT_REQUEST_STATUS)
  status?: DOCUMENT_REQUEST_STATUS;

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
