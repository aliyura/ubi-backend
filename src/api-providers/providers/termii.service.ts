import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TermiiService {
  private readonly logger = new Logger(TermiiService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSms(data: { phoneNumber: string; message: string }) {
    const url =
      this.configService.get<string>('TERMII_BASE_URL') + '/api/sms/send';

    const payload = {
      api_key: this.configService.get<string>('TERMII_API_KEY'),
      to: data.phoneNumber,
      from: 'UBI',
      channel: 'dnd',
      sms: data.message,
    };

    try {
      const response = await axios.post(url, payload);

      if (response.status !== 200) {
        this.logger.error(`Termii SMS failed with status ${response.status}`, response?.data);
        throw new InternalServerErrorException('Failed to send sms');
      }

      return response.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Termii SMS request failed', error?.response?.data || error?.message);
      throw new InternalServerErrorException(error?.response?.data?.message || 'Failed to send sms');
    }
  }
}
