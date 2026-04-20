import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @ApiProperty()
  @IsUUID()
  resourceId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
