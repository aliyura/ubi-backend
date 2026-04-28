import { CURRENCY } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayDto {
  @ApiProperty({ example: 2000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({ example: 123 })
  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  operatorId: number;

  @ApiProperty({ example: '08012345678' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{8,15}$/, {
    message: 'Phone number must be 8–15 digits long',
  })
  phone: string;

  @ApiProperty({ example: CURRENCY.NGN, enum: CURRENCY })
  @IsNotEmpty()
  @IsEnum(CURRENCY, { message: 'Invalid currency code' })
  currency: CURRENCY;

  @ApiProperty({ example: 'IKEDC' })
  @IsNotEmpty()
  @IsString()
  billerCode: string;

  @ApiProperty({ example: 'IKEDC_PREPAID' })
  @IsNotEmpty()
  @IsString()
  itemCode: string;

  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  @IsString()
  @Length(4, 6, { message: 'Wallet PIN must be 4–6 digits long' })
  @Matches(/^[0-9]+$/, { message: 'Wallet PIN must contain only numbers' })
  walletPin: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  addBeneficiary?: boolean;
}
