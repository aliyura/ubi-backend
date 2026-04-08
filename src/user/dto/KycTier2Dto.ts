import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KycTier2Dto {
  @ApiProperty({ example: '12345678901' })
  @IsNotEmpty()
  @IsString()
  @Length(11, 11, { message: 'NIN must be exactly 11 characters long.' })
  @Matches(/^\d+$/, { message: 'NIN must contain only numbers.' })
  nin: string;
}
