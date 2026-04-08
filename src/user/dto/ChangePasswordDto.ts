import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  @Length(4, 10, { message: 'OTP code must be between 4 and 10 characters' })
  @Transform(({ value }) => value?.trim())
  otpCode?: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  newPassword: string;
}
