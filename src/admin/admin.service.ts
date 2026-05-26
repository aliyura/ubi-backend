import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { VerifyAgentAddressDto, GetAgentsDto } from './dto/AgentAddressDto';
import { AddPlanDto } from './dto/AddDataPlanDto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiProviderService } from 'src/api-providers/api-providers.service';
import { AddCablPlanDto } from './dto/AddCablPlanDto';
import { InviteAgentDto } from './dto/InviteAgentDto';
import { EmailService } from 'src/email/email.service';
import { User, USER_ROLE } from '@prisma/client';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
  TIER_ONE_PER_TRANSACTION_LIMIT,
  TIER_TWO_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  TIER_TWO_CUMMULATIVE_BALANCE_LIMIT,
  TIER_TWO_PER_TRANSACTION_LIMIT,
  TIER_THREE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  TIER_THREE_CUMMULATIVE_BALANCE_LIMIT,
  TIER_THREE_PER_TRANSACTION_LIMIT,
  BUSINESS_TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
  BUSINESS_TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
  CABLE_FEE,
  ELECTRICITY_FEE,
  INTERNET_FEE,
  SCHOOLFEE_FEE,
  TRANSPORT_FEE,
  INTERNATIONAL_AIRTIME_FEE,
  GIFT_CARD_FEE,
  REFERRAL_BONUS_PRICE,
} from 'src/constants';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiProvider: ApiProviderService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  getProfile(admin: User) {
    return {
      message: 'Profile fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        adminId: admin.id,
        fullName: admin.fullname,
        email: admin.email,
        role: admin.role,
        passwordLastChangedAt: admin.updatedAt,
        twoFaEnabled: admin.enabledTwoFa,
      },
    };
  }

  getSystemSettings() {
    return {
      message: 'System settings fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        transferLimits: {
          tier1: {
            dailyCumulativeLimit: TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
            perTransactionLimit: TIER_ONE_PER_TRANSACTION_LIMIT,
            walletBalanceLimit: TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
          },
          tier2: {
            dailyCumulativeLimit: TIER_TWO_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
            perTransactionLimit: TIER_TWO_PER_TRANSACTION_LIMIT,
            walletBalanceLimit: TIER_TWO_CUMMULATIVE_BALANCE_LIMIT,
          },
          tier3: {
            dailyCumulativeLimit:
              TIER_THREE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
            perTransactionLimit: TIER_THREE_PER_TRANSACTION_LIMIT,
            walletBalanceLimit: TIER_THREE_CUMMULATIVE_BALANCE_LIMIT,
          },
          businessTier1: {
            dailyCumulativeLimit:
              BUSINESS_TIER_ONE_DAILY_CUMMULATIVE_TRANSACTION_LIMIT,
            walletBalanceLimit: BUSINESS_TIER_ONE_CUMMULATIVE_BALANCE_LIMIT,
          },
        },
        fees: {
          cable: CABLE_FEE,
          electricity: ELECTRICITY_FEE,
          internet: INTERNET_FEE,
          schoolFee: SCHOOLFEE_FEE,
          transport: TRANSPORT_FEE,
          internationalAirtime: INTERNATIONAL_AIRTIME_FEE,
          giftCard: GIFT_CARD_FEE,
          referralBonus: REFERRAL_BONUS_PRICE,
        },
      },
    };
  }

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
        role: body.role,
        expiresAt,
        invitedById: admin.id,
      },
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'https://ubi.com';
    const registrationUrl = `${frontendUrl}/register?token=${token}`;

    try {
      const isCustomerSupportInvite = body.role === USER_ROLE.CUSTOMER_SUPPORT;
      await this.emailService.sendEmail({
        to: body.email,
        subject: isCustomerSupportInvite
          ? "You've Been Invited to Join UBI as Customer Support"
          : "You've Been Invited to Join UBI as an Agent",
        template: 'admin/agent-invitation.hbs',
        context: { registrationUrl },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send agent invitation email to ${body.email}`,
        error,
      );
    }

    return {
      message:
        body.role === USER_ROLE.CUSTOMER_SUPPORT
          ? 'Customer support invitation sent successfully'
          : 'Agent invitation sent successfully',
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

  async getAgents(query: GetAgentsDto) {
    const where: any = { role: USER_ROLE.AGENT };

    if (query.addressStatus === 'pending') {
      where.address = { not: null };
      where.isAddressVerified = false;
    } else if (query.addressStatus === 'verified') {
      where.isAddressVerified = true;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [agents, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullname: true,
          email: true,
          phoneNumber: true,
          address: true,
          state: true,
          city: true,
          isAddressVerified: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: 'Agents fetched successfully',
      statusCode: HttpStatus.OK,
      data: { agents, total, page, limit },
    };
  }

  async verifyAgentAddress(agentId: string, body: VerifyAgentAddressDto) {
    const agent = await this.prisma.user.findFirst({
      where: { id: agentId, role: USER_ROLE.AGENT },
    });

    if (!agent) throw new NotFoundException('Agent not found');

    if (!agent.address) {
      throw new BadRequestException('Agent has not submitted a home address yet');
    }

    await this.prisma.user.update({
      where: { id: agentId },
      data: { isAddressVerified: body.approved },
    });

    return {
      message: body.approved
        ? 'Agent home address verified successfully'
        : 'Agent home address rejected',
      statusCode: HttpStatus.OK,
    };
  }

  async getAgentFarmers(agentId: string, startDate?: string, endDate?: string) {
    const agent = await this.prisma.user.findFirst({
      where: {
        id: agentId,
        role: USER_ROLE.AGENT,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const loanApplications = await this.prisma.loanApplication.findMany({
      where: {
        agentId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullname: true,
            phoneNumber: true,
            role: true,
            createdAt: true,
            country: true,
            status: true,
            tierLevel: true,
            profileImageUrl: true,
            isPhoneVerified: true,
            isEmailVerified: true,
            isBvnVerified: true,
            isNinVerified: true,
            isAddressVerified: true,
          },
        },
      },
      distinct: ['userId'],
    });

    // Get loan application count per farmer
    const farmerLoanCounts = await this.prisma.loanApplication.groupBy({
      by: ['userId'],
      where: {
        agentId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      _count: {
        id: true,
      },
    });

    const loanCountMap = new Map(
      farmerLoanCounts.map((item) => [item.userId, item._count.id]),
    );

    const farmers = loanApplications.map((app) => ({
      id: app.user.id,
      email: app.user.email,
      fullname: app.user.fullname,
      phoneNumber: app.user.phoneNumber,
      country: app.user.country,
      status: app.user.status,
      tierLevel: app.user.tierLevel,
      profileImageUrl: app.user.profileImageUrl,
      verification: {
        isPhoneVerified: app.user.isPhoneVerified,
        isEmailVerified: app.user.isEmailVerified,
        isBvnVerified: app.user.isBvnVerified,
        isNinVerified: app.user.isNinVerified,
        isAddressVerified: app.user.isAddressVerified,
      },
      loanApplicationCount: loanCountMap.get(app.user.id) || 0,
      createdAt: app.user.createdAt,
    }));

    return {
      message: 'Farmers fetched successfully',
      statusCode: HttpStatus.OK,
      data: {
        agent: {
          id: agent.id,
          fullname: agent.fullname,
          email: agent.email,
        },
        farmers,
        totalFarmers: farmers.length,
      },
    };
  }
}
