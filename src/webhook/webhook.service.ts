import { Injectable, Logger } from '@nestjs/common';
import { KoboFarmVerificationPayload } from './kobo.types';
import { BellAccountService } from 'src/api-providers/providers/bellmfb.service';
import { FlutterwaveService } from 'src/api-providers/providers/flutterwave.service';
import { SafeHavenService } from 'src/api-providers/providers/safe-haven.service';
import { VFDBankService } from 'src/api-providers/providers/VFDBank.service';
import { FarmService } from 'src/farm/farm.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly flutterwaveService: FlutterwaveService,
    private readonly bellBankService: BellAccountService,
    private readonly VFDBankService: VFDBankService,
    private readonly safeHavenService: SafeHavenService,
    private readonly farmService: FarmService,
    private readonly prisma: PrismaService,
  ) {}

  async resolveFlutterwaveWebhook(body: any) {
    const event = body?.event;
    const data: any = body?.data;

    this.logger.log(
      `Flutterwave routing event: ${event}, status: ${data?.status}`,
    );

    switch (event) {
      case 'charge.completed':
        if (data?.status === 'successful') {
          this.logger.log(
            `Flutterwave charge.completed — dispatching handlePaymentSuccess, ref: ${data?.id}`,
          );
          this.flutterwaveService.handlePaymentSuccess(body);
        } else if (data?.status === 'failed') {
          this.logger.log(
            `Flutterwave charge.completed — dispatching handlePaymentFailure, ref: ${data?.id}`,
          );
          this.flutterwaveService.handlePaymentFailure(body);
        }
        break;
      case 'transfer.completed':
        if (data?.status === 'SUCCESSFUL') {
          this.logger.log(
            `Flutterwave transfer.completed — dispatching handleTransferSuccess, ref: ${data?.reference}`,
          );
          this.flutterwaveService.handleTransferSuccess(body);
        } else if (data?.status === 'FAILED') {
          this.logger.log(
            `Flutterwave transfer.completed — dispatching handleTransferFailure, ref: ${data?.reference}`,
          );
          this.flutterwaveService.handleTransferFailure(body);
        }
        break;
      default:
        this.logger.warn(`Flutterwave unhandled event: ${event}`);
    }
  }

  async resolveVFDWebhook(body: any) {
    this.logger.log(
      `VFD routing payment — ref: ${body?.reference}, account: ${body?.account_number}`,
    );
    this.VFDBankService.handlePaymentSuccess(body);
  }

  async resolveSafeHavenWebhook(body: any) {
    this.logger.log(
      `SafeHaven routing event — type: ${body?.type}, ref: ${body?.reference}`,
    );

    switch (body?.type) {
      case 'transfer':
        this.safeHavenService.handleTransferWebhook(body);
        break;
      default:
        this.logger.warn(`SafeHaven unhandled event type: ${body?.type}`);
    }
  }

  async resolveBellBankWebhook(request: any) {
    this.logger.log(
      `BellMFB routing event — event: ${request?.event}, ref: ${request?.reference}`,
    );

    switch (request?.event) {
      case 'collection':
        this.bellBankService.handleFundingWebhook(request);
        break;
      default:
        this.logger.warn(`BellMFB unhandled event: ${request?.event}`);
    }
  }

  async resolveKoboWebhook(body: KoboFarmVerificationPayload) {
    const farmId: string | undefined = body?.Farm_Id;

    this.logger.log(`KoboToolbox submission received — Farm_Id: ${farmId}`);

    if (!farmId) {
      this.logger.warn('KoboToolbox submission missing Farm_Id — skipping');
      return;
    }

    const farm = await this.farmService.getFarmById(farmId);
    if (!farm) {
      this.logger.warn(`KoboToolbox: farm not found for id ${farmId}`);
      return;
    }

    if (farm.isVerified) {
      this.logger.log(
        `KoboToolbox: farm ${farmId} already verified — skipping`,
      );
      return;
    }

    // Coordinates come as a single "lat lng alt accuracy" string or from _geolocation
    let latitude: number | undefined = body?._geolocation?.[0];
    let longitude: number | undefined = body?._geolocation?.[1];
    if (body?.latitude_longitude) {
      const parts = (body.latitude_longitude as string).trim().split(/\s+/);
      if (parts.length >= 2) {
        latitude = parseFloat(parts[0]);
        longitude = parseFloat(parts[1]);
      }
    }

    await this.prisma.farm.update({
      where: { id: farmId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        ...(latitude != null && { latitude }),
        ...(longitude != null && { longitude }),
      },
    });

    // Persist any photos attached to the submission
    const attachments: any[] = body?._attachments ?? [];
    for (const attachment of attachments) {
      const url: string | undefined =
        attachment?.download_url ?? attachment?.download_large_url;
      const filename: string | undefined = attachment?.filename;
      if (url && filename) {
        await this.prisma.farmPhoto.create({
          data: { farmId, url, filename },
        });
      }
    }

    this.logger.log(`KoboToolbox: farm ${farmId} marked as verified.`);
  }
}
