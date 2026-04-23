import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AddPlanDto } from './dto/AddDataPlanDto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiProviderService } from 'src/api-providers/api-providers.service';
import { AddCablPlanDto } from './dto/AddCablPlanDto';
import { InviteAgentDto } from './dto/InviteAgentDto';
import { EmailService } from 'src/email/email.service';
import { User } from '@prisma/client';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiProvider: ApiProviderService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async inviteAgent(body: InviteAgentDto, admin: User) {
    const pending = await this.prisma.agentInvitation.findFirst({
      where: { email: body.email, status: 'PENDING' },
    });

    if (pending) {
      throw new ConflictException(
        'An active invitation has already been sent to this email address',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.agentInvitation.create({
      data: {
        email: body.email,
        token,
        expiresAt,
        invitedById: admin.id,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'https://ubi.com';
    const registrationUrl = `${frontendUrl}/register?token=${token}`;

    try {
      await this.emailService.sendEmail({
        to: body.email,
        subject: "You've Been Invited to Join UBI as an Agent",
        template: 'admin/agent-invitation.hbs',
        context: { registrationUrl },
      });
    } catch (error) {
      this.logger.error(`Failed to send agent invitation email to ${body.email}`, error);
    }

    return {
      message: 'Agent invitation sent successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async addDataPlan(body: AddPlanDto) {
    const dataPlan = await this.prisma.dataPlan.findFirst({
      where: {
        operatorId: body.operatorId,
        network: body.network,
      },
    });

    if (dataPlan)
      throw new BadRequestException(
        'Data plan with operation id already exist',
      );

    // create new data plan
    await this.prisma.dataPlan.create({
      data: {
        network: body.network,
        operatorId: body.operatorId,
        planName: body.planName,
        countryISOCode: this.apiProvider.getCountryCodeFromCurrency(
          body.currency,
        ),
      },
    });

    return {
      message: 'Data plan added successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async addAirtimePlan(body: AddPlanDto) {
    const airtimePlan = await this.prisma.airtimePlan.findFirst({
      where: {
        operatorId: body.operatorId,
        network: body.network,
      },
    });

    if (airtimePlan)
      throw new BadRequestException(
        'Airtime plan with operation id already exist',
      );

    // create new airtime plan
    await this.prisma.airtimePlan.create({
      data: {
        network: body.network,
        operatorId: body.operatorId,
        planName: body.planName,
        countryISOCode: this.apiProvider.getCountryCodeFromCurrency(
          body.currency,
        ),
      },
    });

    return {
      message: 'Airtime plan added successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async addCablePlan(body: AddCablPlanDto) {
    const cablePlan = await this.prisma.cablePlan.findFirst({
      where: {
        billerCode: body.billerCode,
        planName: body.planName,
      },
    });

    if (cablePlan)
      throw new BadRequestException(
        'Cable plan with biller code already exist',
      );

    await this.prisma.cablePlan.create({
      data: {
        planName: body.planName,
        countryISOCode: this.apiProvider.getCountryCodeFromCurrency(
          body.currency,
        ),
        billerCode: body.billerCode,
        description: body.description,
        shortName: body.shortName,
      },
    });

    return {
      message: 'Cable plan added successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async addElectricityPlan(body: AddCablPlanDto) {
    const electricityPlan = await this.prisma.electricityPlan.findFirst({
      where: {
        billerCode: body.billerCode,
        planName: body.planName,
      },
    });

    if (electricityPlan)
      throw new BadRequestException(
        'Electricity plan with biller code already exist',
      );

    await this.prisma.electricityPlan.create({
      data: {
        planName: body.planName,
        countryISOCode: this.apiProvider.getCountryCodeFromCurrency(
          body.currency,
        ),
        billerCode: body.billerCode,
        description: body.description,
        shortName: body.shortName,
      },
    });

    return {
      message: 'Electricity plan added successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async addInternetServicePlan(body: AddCablPlanDto) {
    const internetservicePlan = await this.prisma.electricityPlan.findFirst({
      where: {
        billerCode: body.billerCode,
        planName: body.planName,
      },
    });

    if (internetservicePlan)
      throw new BadRequestException(
        'Internet service plan with biller code already exist',
      );

    await this.prisma.internetservicePlan.create({
      data: {
        planName: body.planName,
        countryISOCode: this.apiProvider.getCountryCodeFromCurrency(
          body.currency,
        ),
        billerCode: body.billerCode,
        description: body.description,
        shortName: body.shortName,
      },
    });

    return {
      message: 'Internet service plan added successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async addTransportPlan(body: AddCablPlanDto) {
    const transportPlan = await this.prisma.transportPlan.findFirst({
      where: {
        billerCode: body.billerCode,
        planName: body.planName,
      },
    });

    if (transportPlan)
      throw new BadRequestException(
        'Transport plan with biller code already exist',
      );

    await this.prisma.transportPlan.create({
      data: {
        planName: body.planName,
        countryISOCode: this.apiProvider.getCountryCodeFromCurrency(
          body.currency,
        ),
        billerCode: body.billerCode,
        description: body.description,
        shortName: body.shortName,
      },
    });

    return {
      message: 'Transport plan added successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async addSchoolFeePlan(body: AddCablPlanDto) {
    const schoolFeePlan = await this.prisma.schoolfeePlan.findFirst({
      where: {
        billerCode: body.billerCode,
        planName: body.planName,
      },
    });

    if (schoolFeePlan)
      throw new BadRequestException(
        'School fee plan with biller code already exist',
      );

    await this.prisma.schoolfeePlan.create({
      data: {
        planName: body.planName,
        countryISOCode: this.apiProvider.getCountryCodeFromCurrency(
          body.currency,
        ),
        billerCode: body.billerCode,
        description: body.description,
        shortName: body.shortName,
      },
    });

    return {
      message: 'School fee plan added successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async deletePlan(id: string, bill_type: string) {
    switch (bill_type) {
      case 'data':
        const exitsingDataPlan = await this.prisma.dataPlan.findFirst({
          where: {
            id,
          },
        });

        if (!exitsingDataPlan)
          throw new NotFoundException('Data plan with id not found');

        // delete
        await this.prisma.dataPlan.delete({
          where: {
            id,
          },
        });

        break;
      case 'airtime':
        const exitsingAirtimePlan = await this.prisma.dataPlan.findFirst({
          where: {
            id,
          },
        });

        if (!exitsingAirtimePlan)
          throw new NotFoundException('Airtime plan with id not found');

        // delete
        await this.prisma.airtimePlan.delete({
          where: {
            id,
          },
        });
        break;
      default:
        console.log('no bill type match found');
    }

    return {
      message: 'Plan with id deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
