import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { PasscodeLoginDto } from './dto/PasscodeLoginDto';
import { ValidateTwoFaDto } from 'src/user/dto/ValidateTwoFaDto';
import { VerifyTwoFaDto } from 'src/user/dto/VerifyTwoFaDto';
import { authResponse } from './auth.response';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user with email and password' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: authResponse.login,
  })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('passcode-login')
  @ApiOperation({ summary: 'Login user with passcode' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: authResponse.passcodeLogin,
  })
  async passcodeLogin(@Body() body: PasscodeLoginDto) {
    return this.authService.passcodeLogin(body);
  }

  @Post('resend-2fa')
  @ApiOperation({ summary: 'Resend 2FA code' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: authResponse.resend2fa,
  })
  async send(@Body() body: ValidateTwoFaDto) {
    return this.authService.sendTwoFa(body);
  }

  @Post('verify-2fa')
  @ApiOperation({ summary: 'Verify 2FA code' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: authResponse.verify2fa,
  })
  async verifyTwoFaCode(@Body() body: VerifyTwoFaDto) {
    return this.authService.verifyTwoFaCode(body);
  }
}
