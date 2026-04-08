import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KycTier3Dto {
  @ApiProperty({ example: 'Lagos' })
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString({ message: 'State must be a string' })
  @IsNotEmpty({ message: 'State is required' })
  state: string;

  @ApiProperty({ example: '12 Allen Avenue, Ikeja' })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address: string;
}
