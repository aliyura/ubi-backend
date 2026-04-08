import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { PasscodeLoginDto } from './dto/PasscodeLoginDto';
import { ValidateTwoFaDto } from 'src/user/dto/ValidateTwoFaDto';
import { VerifyTwoFaDto } from 'src/user/dto/VerifyTwoFaDto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('passcode-login')
  async passcodeLogin(@Body() body: PasscodeLoginDto) {
    return this.authService.passcodeLogin(body);
  }

  @Post('resend-2fa')
  async send(@Body() body: ValidateTwoFaDto) {
    return this.authService.sendTwoFa(body);
  }

  @Post('verify-2fa')
  async verifyTwoFaCode(@Body() body: VerifyTwoFaDto) {
    return this.authService.verifyTwoFaCode(body);
  }
}
