import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NinDto {
  @ApiProperty({ example: '12345678901' })
  @IsString({ message: 'NIN must be a string' })
  @IsNotEmpty({ message: 'NIN is required' })
  @Length(11, 11, { message: 'NIN must be exactly 11 digits' })
  @Matches(/^\d{11}$/, { message: 'NIN must contain only numbers' })
  nin: string;
}
