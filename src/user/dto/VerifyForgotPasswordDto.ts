import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyForgotPasswordDto {
  @ApiProperty({ example: 'johndoe' })
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]+$/, { message: 'OTP must contain only numbers' })
  otpCode: string; // renamed for clarity
}
