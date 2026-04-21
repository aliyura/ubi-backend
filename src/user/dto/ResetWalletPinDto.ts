import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetWalletPinDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]+$/, { message: 'OTP must contain only numbers' })
  otpCode: string;

  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  pin: string;

  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  confirmPin: string;
}
