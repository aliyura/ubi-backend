import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(45, { message: 'IP address too long' }) // IPv6 max length
  @Transform(({ value }) => value?.trim())
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  operatingSystem?: string;
}
