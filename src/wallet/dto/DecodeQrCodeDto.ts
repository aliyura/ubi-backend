import { IsNotEmpty, IsString, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DecodeQrCodeDto {
  @ApiProperty({ example: 'upi:john-doe:5000:NGN:wallet' })
  @IsString({ message: 'QR Code must be a string' })
  @IsNotEmpty({ message: 'QR Code is required' })
  @MinLength(10, { message: 'QR Code must be at least 10 characters long' })
  @MaxLength(500, { message: 'QR Code must not exceed 500 characters' })
  @Matches(/^[A-Za-z0-9+/=:\-_]+$/, {
    message: 'QR Code must contain only valid characters',
  })
  qrCode: string;
}
