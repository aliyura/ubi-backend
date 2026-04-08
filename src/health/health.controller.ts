import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { healthResponse } from './health.response';

@Controller('v1/health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: healthResponse.check,
  })
  check() {
    return { status: 'ok' };
  }
}
