import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PasscodeLoginDto {
  @ApiProperty({ example: 'johndoe' })
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: 'Passcode is required' })
  @Matches(/^\d{6}$/, { message: 'Passcode must be exactly 6 digits' })
  passcode: string;

  @ApiPropertyOptional({ example: '102.89.1.22' })
  @IsOptional()
  @IsString()
  @MaxLength(45, { message: 'IP address too long' }) // IPv6 max length
  @Transform(({ value }) => value?.trim())
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Samsung Galaxy S24' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  deviceName?: string;

  @ApiPropertyOptional({ example: 'Android 15' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  operatingSystem?: string;
}
