import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneNumberDto {
  @ApiProperty({ example: '08012345678' })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  @Length(10, 15, {
    message: 'Phone number must be between 10 and 15 digits long',
  })
  phoneNumber: string;

  @ApiProperty({ example: '123456' })
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]+$/, { message: 'OTP must contain only numbers' })
  otpCode: string;
}
