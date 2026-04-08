import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NinDto {
  @ApiProperty({ example: '12345678901' })
  @IsString({ message: 'NIN must be a string' })
  @IsNotEmpty({ message: 'NIN is required' })
  nin: string;
}
