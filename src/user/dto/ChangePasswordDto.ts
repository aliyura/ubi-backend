import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  @Length(4, 10, { message: 'OTP code must be between 4 and 10 characters' })
  @Transform(({ value }) => value?.trim())
  otpCode?: string;

  @ApiProperty({ example: 'OldPass123!' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  oldPassword: string;

  @ApiProperty({ example: 'NewPass123!' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters' })
  newPassword: string;
}
