import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetKoboFormUrlDto {
  @ApiProperty({ example: 'https://ee.kobotoolbox.org/x/abc123' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 'Farm Verification Form' })
  @IsString()
  @IsOptional()
  label?: string;
}

export class UpdateKoboFormUrlDto {
  @ApiPropertyOptional({ example: 'https://ee.kobotoolbox.org/x/xyz789' })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ example: 'Updated Farm Verification Form' })
  @IsString()
  @IsOptional()
  label?: string;
}
