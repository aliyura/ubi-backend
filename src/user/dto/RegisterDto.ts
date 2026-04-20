import { ACCOUNT_TYPE, CURRENCY } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RegisterFarmDto } from './RegisterFarmDto';

export class RegisterDto {
  @ApiProperty({ example: 'johndoe' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullname: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '08012345678' })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  @Length(10, 15, {
    message: 'Phone number must be between 10 and 15 digits long',
  })
  phoneNumber: string;

  @ApiProperty({ example: '8-Mar-1995' })
  @IsNotEmpty()
  @IsString()
  @Matches(
    /^(0?[1-9]|[12][0-9]|3[01])-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}$/,
    {
      message:
        'Date of birth must be in format: DD-MMM-YYYY (e.g., 8-Mar-1995)',
    },
  )
  dateOfBirth: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  password: string;

  @ApiPropertyOptional({ example: 'NG' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: 'UBIREF123' })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiPropertyOptional({ example: CURRENCY.NGN, enum: CURRENCY })
  @IsOptional()
  @IsEnum(CURRENCY)
  currency?: CURRENCY;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBusinessRegistered?: boolean;

  @ApiPropertyOptional({ example: ACCOUNT_TYPE.USER, enum: ACCOUNT_TYPE })
  @IsOptional()
  @IsEnum(ACCOUNT_TYPE)
  accountType: ACCOUNT_TYPE = ACCOUNT_TYPE.USER;

  @ApiPropertyOptional({
    description: 'Farm details — all required farm fields must be provided if this object is included',
    type: () => RegisterFarmDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterFarmDto)
  farm?: RegisterFarmDto;
}
