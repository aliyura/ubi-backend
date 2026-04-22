import { Injectable, Logger } from '@nestjs/common';
import { BellAccountService } from 'src/api-providers/providers/bellmfb.service';
import { FlutterwaveService } from 'src/api-providers/providers/flutterwave.service';
import { SafeHavenService } from 'src/api-providers/providers/safe-haven.service';
import { VFDBankService } from 'src/api-providers/providers/VFDBank.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly flutterwaveService: FlutterwaveService,
    private readonly bellBankService: BellAccountService,
    private readonly VFDBankService: VFDBankService,
    private readonly safeHavenService: SafeHavenService,
  ) {}

  async resolveFlutterwaveWebhook(body: any) {
    const event = body?.event;
    const data: any = body?.data;

    this.logger.log(`Flutterwave routing event: ${event}, status: ${data?.status}`);

    switch (event) {
      case 'charge.completed':
        if (data?.status === 'successful') {
          this.logger.log(`Flutterwave charge.completed — dispatching handlePaymentSuccess, ref: ${data?.id}`);
          this.flutterwaveService.handlePaymentSuccess(body);
        } else if (data?.status === 'failed') {
          this.logger.log(`Flutterwave charge.completed — dispatching handlePaymentFailure, ref: ${data?.id}`);
          this.flutterwaveService.handlePaymentFailure(body);
        }
        break;
      case 'transfer.completed':
        if (data?.status === 'SUCCESSFUL') {
          this.logger.log(`Flutterwave transfer.completed — dispatching handleTransferSuccess, ref: ${data?.reference}`);
          this.flutterwaveService.handleTransferSuccess(body);
        } else if (data?.status === 'FAILED') {
          this.logger.log(`Flutterwave transfer.completed — dispatching handleTransferFailure, ref: ${data?.reference}`);
          this.flutterwaveService.handleTransferFailure(body);
        }
        break;
      default:
        this.logger.warn(`Flutterwave unhandled event: ${event}`);
    }
  }

  async resolveVFDWebhook(body: any) {
    this.logger.log(`VFD routing payment — ref: ${body?.reference}, account: ${body?.account_number}`);
    this.VFDBankService.handlePaymentSuccess(body);
  }

  async resolveSafeHavenWebhook(body: any) {
    this.logger.log(`SafeHaven routing event — type: ${body?.type}, ref: ${body?.reference}`);

    switch (body?.type) {
      case 'transfer':
        this.safeHavenService.handleTransferWebhook(body);
        break;
      default:
        this.logger.warn(`SafeHaven unhandled event type: ${body?.type}`);
    }
  }

  async resolveBellBankWebhook(request: any) {
    this.logger.log(`BellMFB routing event — event: ${request?.event}, ref: ${request?.reference}`);

    switch (request?.event) {
      case 'collection':
        this.bellBankService.handleFundingWebhook(request);
        break;
      default:
        this.logger.warn(`BellMFB unhandled event: ${request?.event}`);
    }
  }
}
