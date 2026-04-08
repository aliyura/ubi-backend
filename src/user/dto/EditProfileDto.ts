import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EditProfileDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiPropertyOptional({ example: '08012345678' })
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phoneNumber: string;
}
