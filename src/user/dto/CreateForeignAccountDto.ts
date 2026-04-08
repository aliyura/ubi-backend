import { CURRENCY } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateForeignAccountDto {
  @ApiProperty({ example: CURRENCY.USD, enum: CURRENCY })
  @IsNotEmpty({ message: 'Currency is required' })
  @IsEnum(CURRENCY, { message: 'Currency must be a valid enum value' })
  currency: CURRENCY;
}
