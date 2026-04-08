import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { webhookResponse } from './webhook.response';

@Controller('v1/webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('flutterwave')
  @ApiOperation({ summary: 'Handle Flutterwave webhook' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: webhookResponse.flutterwaveWebhookHanlder,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: webhookResponse.unauthorizedWebhook,
  })
  async flutterwaveWebhookHanlder(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const secretHash = this.configService.get<string>(
      'FLUTTERWAVE_SECRET_HASH',
    );

    const signature = req.headers['verif-hash'];

    if (!signature || signature !== secretHash) {
      return res.status(401).end();
    }

    await this.webhookService.resolveFlutterwaveWebhook(body);
    return res.status(200).end();
  }

  @Post('VFD/payment')
  @ApiOperation({ summary: 'Handle VFD payment webhook' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: webhookResponse.vfdWebhookHanlder,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: webhookResponse.unauthorizedWebhook,
  })
  async VFDWebhookHanlder(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const secretHash = this.configService.get<string>('VFD_SECRET_HASH');

    const secretHashFromRequest = req.headers['secret-hash'];

    if (secretHashFromRequest !== secretHash) return res.status(401).end();

    await this.webhookService.resolveVFDWebhook(body);
    return res.status(200).end();
  }

  @Post('safehaven')
  @ApiOperation({ summary: 'Handle SafeHaven webhook' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: webhookResponse.safeHavenHandler,
  })
  async safeHavenHandler(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.webhookService.resolveSafeHavenWebhook(body);
    return res.status(200).end();
  }

  @Post('bellmfb')
  @ApiOperation({ summary: 'Handle Bell MFB webhook' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: webhookResponse.bellBankHandler,
  })
  async bellBankHandler(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.webhookService.resolveBellBankWebhook(body);
    return res.status(200).end();
  }
}
