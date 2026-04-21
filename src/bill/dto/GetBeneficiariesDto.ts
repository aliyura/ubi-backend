import { BILL_TYPE } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GetBeneficiariesDto {
  @ApiProperty({
    enum: BILL_TYPE,
    example: BILL_TYPE.data,
    examples: {
      data: { value: BILL_TYPE.data },
      airtime: { value: BILL_TYPE.airtime },
      internationalAirtime: { value: BILL_TYPE.internationalAirtime },
      cable: { value: BILL_TYPE.cable },
      electricity: { value: BILL_TYPE.electricity },
      internet: { value: BILL_TYPE.internet },
      transport: { value: BILL_TYPE.transport },
      schoolfee: { value: BILL_TYPE.schoolfee },
      giftcard: { value: BILL_TYPE.giftcard },
    },
    description: 'Type of bill. Must be one of the valid BILL_TYPE enum values.',
  })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEnum(BILL_TYPE, {
    message: `billType must be one of: ${Object.values(BILL_TYPE).join(', ')}`,
  })
  billType: BILL_TYPE;
}
