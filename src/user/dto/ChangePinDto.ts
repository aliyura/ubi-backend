import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePinDto {
  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  oldPin: string;

  @ApiProperty({ example: '4321' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{4}$/, {
    message: 'PIN must be exactly 4 digits',
  })
  newPin: string;
}
