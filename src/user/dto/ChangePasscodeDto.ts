import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasscodeDto {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Passcode must be exactly 6 digits' })
  @Matches(/^[0-9]+$/, { message: 'Passcode must contain only numbers' })
  oldPasscode: string;

  @ApiProperty({ example: '654321' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Passcode must be exactly 6 digits' })
  @Matches(/^[0-9]+$/, { message: 'Passcode must contain only numbers' })
  newPasscode: string;
}
