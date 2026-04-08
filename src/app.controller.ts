import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ContactUsDto } from './dto/ContactUsDto';
import { appResponse } from './app.response';

@Controller('v1')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('contact-us')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send contact us message' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: appResponse.contactUs,
  })
  async contactUs(@Body() body: ContactUsDto) {
    return this.appService.contactUs(body);
  }
}
