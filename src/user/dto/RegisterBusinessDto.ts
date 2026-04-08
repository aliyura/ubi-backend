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
} from 'class-validator';

export class RegisterBusinessDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  fullname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  @Length(10, 15, {
    message: 'Phone number must be between 10 and 15 digits long',
  })
  phoneNumber: string;

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

  @IsNotEmpty()
  @IsString()
  companyRegistrationNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  password: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsEnum(CURRENCY)
  currency?: CURRENCY;

  @IsOptional()
  @IsBoolean()
  isBusinessRegistered?: boolean;

  @IsOptional()
  @IsEnum(ACCOUNT_TYPE)
  accountType: ACCOUNT_TYPE = ACCOUNT_TYPE.BUSINESS;
}
