import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFarmerAccountDto {
  @ApiProperty({ example: 'RC1234567' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 14, { message: 'Company registration number must be 6–14 characters' })
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Company registration number must be alphanumeric' })
  @Transform(({ value }) => value?.trim())
  companyRegistrationNumber: string;

  @ApiProperty({ example: '22345678901' })
  @IsNotEmpty()
  @IsString()
  @Length(11, 11, { message: 'BVN must be exactly 11 digits' })
  @Matches(/^\d{11}$/, { message: 'BVN must contain only numbers' })
  @Transform(({ value }) => value?.trim())
  bvn: string;
}
