import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class VerifyAgentAddressDto {
  @ApiProperty({ example: true, description: 'true to approve, false to reject' })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ example: 'Address could not be confirmed' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetAgentsDto {
  @ApiPropertyOptional({
    enum: ['pending', 'verified', 'all'],
    description: 'Filter by address verification status',
  })
  @IsOptional()
  @IsEnum(['pending', 'verified', 'all'])
  addressStatus?: 'pending' | 'verified' | 'all';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
