import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLE } from '@prisma/client';
import { IsIn } from 'class-validator';

export class InviteAgentDto {
  @ApiProperty({ example: 'agent@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: [USER_ROLE.AGENT, USER_ROLE.CUSTOMER_SUPPORT], example: USER_ROLE.AGENT })
  @IsIn([USER_ROLE.AGENT, USER_ROLE.CUSTOMER_SUPPORT], {
    message: `Role must be one of: ${USER_ROLE.AGENT}, ${USER_ROLE.CUSTOMER_SUPPORT}`,
  })
  role: USER_ROLE;
}
