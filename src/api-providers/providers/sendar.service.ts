import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SMSContact {
  number: string;
  body: string;
  sms_type: 'plain' | 'unicode';
}

interface SendSMSPayload {
  contact: SMSContact[];
}

interface SMSLogEntry {
  uid: string;
  number: string;
  status: string;
  created_at: string;
}

interface SendSMSResponse {
  status: string;
  sms_logs: SMSLogEntry[];
  message: string;
}

interface GetSMSResponse {
  // Define the structure based on the actual API response
  status: string;
  data: {
    uid: string;
    number: string;
    status: string;
    created_at: string;
    // Add other fields as per the actual API response
  };
}

@Injectable()
export class SendarSmsService {
  private readonly logger = new Logger(SendarSmsService.name);

  constructor(private readonly configService: ConfigService) {}

  private get baseUrl(): string {
    const url = this.configService.get<string>('SENDAR_BASE_URL');
    if (!url) {
      this.logger.warn('SENDAR_BASE_URL is not set');
    }
    return url;
  }

  private getHeaders() {
    return {
      'Api-key': this.configService.get<string>('SENDAR_API_KEY'),
      'Content-Type': 'application/json',
    };
  }

  async sendSMS(payload: SendSMSPayload): Promise<SendSMSResponse> {
    const url = `${this.baseUrl}/sms/send`;
    const requestBody = {
      ...payload,
      wallet_type: 'transactional',
      sender_id: 'UBI',
    };

    this.logger.debug(`Sendar SMS request to: ${url}`);

    try {
      const response = await axios.post(url, requestBody, {
        headers: this.getHeaders(),
      });

      if (response?.status !== 200) {
        this.logger.error(`Sendar SMS failed with status ${response?.status}`, response?.data);
        throw new InternalServerErrorException('Failed to send SMS');
      }

      return response.data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      const responseData = error.response?.data;
      this.logger.error(
        `Sendar SMS request failed [status=${error.response?.status}]: ${JSON.stringify(responseData) ?? error.message}`,
        error.stack,
      );
      const reason =
        responseData?.message ||
        responseData?.error ||
        responseData?.errors ||
        error.message ||
        'Failed to send SMS';
      throw new InternalServerErrorException(reason);
    }
  }

  async getSMS(uid: string): Promise<GetSMSResponse> {
    const url = `${this.baseUrl}/get/sms/${uid}`;

    try {
      const response = await axios.get(url, {
        headers: this.getHeaders(),
      });

      if (response?.status !== 200) {
        throw new InternalServerErrorException(
          'Failed to retrieve SMS information',
        );
      }

      return response.data;
    } catch (error) {
      console.error(
        'Error retrieving SMS information:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        error.response?.data?.message || 'Failed to retrieve SMS information',
      );
    }
  }
}
