import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'johndoe' })
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiPropertyOptional({ example: '102.89.1.22' })
  @IsOptional()
  @IsString()
  @MaxLength(45, { message: 'IP address too long' }) // IPv6 max length
  @Transform(({ value }) => value?.trim())
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  deviceName?: string;

  @ApiPropertyOptional({ example: 'iOS 18.3' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  operatingSystem?: string;
}
