import { Injectable, Logger } from '@nestjs/common';
import { DojahService } from './dojah.service';
import { TermiiService } from './termii.service';
import { SendarSmsService } from './sendar.service';

@Injectable()
export class HelperService {
  private readonly logger = new Logger(HelperService.name);

  constructor(
    private readonly dojahService: DojahService,
    private readonly termiiService: TermiiService,
    private readonly sendarService: SendarSmsService,
  ) { }

  async sendSms(
    phoneNumber: string,
    message: string,
    type: 'dojah' | 'termii' |  'sendar',
    channel: 'sms' | 'whatsapp' = 'sms',
  ) {
    const formattedPhone = this.addCountryCode(phoneNumber);
    this.logger.debug(`Routing SMS via ${type} to: ${formattedPhone.slice(-4).padStart(formattedPhone.length, '*')}`);

    if (type === 'dojah') {
      return this.dojahService.sendSms({
        phoneNumber: formattedPhone,
        message,
        channel,
      });
    } else if (type === 'termii') {
      return this.termiiService.sendSms({
        phoneNumber: formattedPhone,
        message,
      });
    } else if (type === 'sendar') {
      return this.sendarService.sendSMS({
        contact: [{
          number: formattedPhone,
          body: message,
          sms_type: 'plain',
        }],
      });
    } else {
      this.logger.warn(`Unrecognised SMS provider type: ${type}`);
    }
  }

  addCountryCode(phoneNumber: string) {
    // Check if the phone number already starts with '+234'
    if (phoneNumber?.startsWith('234')) {
      return "+" + phoneNumber;
    }
    // Check if the phone number already starts with '+234'
    if (phoneNumber?.startsWith('+234')) {
      return phoneNumber;
    }
    // Remove leading zeros and add '+234'
    if (phoneNumber?.startsWith('0')) {
      phoneNumber = phoneNumber.substring(1);
    }
    return '+234' + phoneNumber;
  }
}
