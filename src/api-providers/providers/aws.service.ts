import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageType,
  PinpointSMSVoiceV2Client,
  SendTextMessageCommand,
} from '@aws-sdk/client-pinpoint-sms-voice-v2';

@Injectable()
export class AwsService {
  private client: PinpointSMSVoiceV2Client;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    const inferredRegion = endpoint?.match(/s3[.-]([a-z0-9-]+)\./i)?.[1];

    this.client = new PinpointSMSVoiceV2Client({
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get<string>('AWS_S3_KEY_SECRET'),
      },
      region: inferredRegion || 'us-east-1',
    });
  }

  async sendSms(data: { phoneNumber: string; message: string }) {
    const command = new SendTextMessageCommand({
      DestinationPhoneNumber: data.phoneNumber,
      MessageBody: data.message,
      MessageType: MessageType.TRANSACTIONAL,
      TimeToLive: 600,
      OriginationIdentity: 'P2G',
    });

    try {
      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }
}
