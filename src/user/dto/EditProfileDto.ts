import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EditProfileDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiPropertyOptional({ example: '08012345678' })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 digits long' })
  phoneNumber?: string;
}
