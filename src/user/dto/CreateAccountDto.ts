import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: '22345678901' })
  @IsNotEmpty()
  @IsString()
  @Length(11, 11, { message: 'BVN must be exactly 11 digits' })
  @Matches(/^\d{11}$/, { message: 'BVN must contain only numbers' })
  @Transform(({ value }) => value?.trim())
  bvn: string;
}
