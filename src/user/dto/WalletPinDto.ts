import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WalletPinDto {
  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  pin: string;
}
