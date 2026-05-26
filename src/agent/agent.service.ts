import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanApplicationService } from 'src/loan-application/loan-application.service';
import { LoanEligibilityService } from 'src/loan-eligibility/loan-eligibility.service';
import { NotificationService } from 'src/notification/notification.service';
import { UserService } from 'src/user/user.service';
import { LoanCartService } from 'src/loan-cart/loan-cart.service';
import {
  AGENT_ACTION,
  AddCartItemDto,
  UpdateCartItemDto,
  GetActivityLogsDto,
  SubmitVerificationDto,
  OnboardFarmerDto,
  BulkOnboardFarmersDto,
  CreateFarmForFarmerDto,
  SubmitLoanForFarmerDto,
  SubmitMarketplaceLoanForFarmerDto,
  QueryOnboardedFarmersDto,
  UpdateHomeAddressDto,
} from './dto';
import {
  ACCOUNT_TYPE,
  LOAN_APPLICATION_STATUS,
  NOTIFICATION_TYPE,
  Prisma,
  USER_ROLE,
  User,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Helpers } from 'src/helpers';
import { plainToInstance } from 'class-transformer';
import { UserEntity } from 'src/user/serializer/user.serializer';
import { KycTier2Dto, KycTier3Dto } from 'src/user/dto';

@Injectable()
export class AgentService {
  private readonly BCRYPT_SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly loanAppService: LoanApplicationService,
    private readonly eligibility: LoanEligibilityService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly loanCartService: LoanCartService,
  ) {}

  async submitVerification(
    id: string,
    body: SubmitVerificationDto,
    agent: User,
  ) {
    const app = await this.prisma.loanApplication.findFirst({
      where: {
        id,
        user: {
          onboardedByAgentId: agent.id,
        },
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.agentId && app.agentId !== agent.id) {
      throw new ForbiddenException('You are not assigned to this application');
    }

    this.loanAppService.validateTransition(
      app.status,
      LOAN_APPLICATION_STATUS.UnderReview,
    );

    const agentUser = await this.prisma.user.findUnique({
      where: { id: agent.id },
      select: { fullname: true },
    });

    await this.prisma.$transaction([
      this.prisma.fieldVerification.upsert({
        where: { applicationId: id },
        create: {
          applicationId: id,
          agentId: agent.id,
          farmExists: body.farmExists,
          visitedAt: body.visitedAt ? new Date(body.visitedAt) : undefined,
          cropConfirmed: body.cropConfirmed,
          estimatedFarmSize: body.estimatedFarmSize,
          recommendation: body.recommendation,
          note: body.note,
          photos: body.photos ?? [],
        },
        update: {
          farmExists: body.farmExists,
          visitedAt: body.visitedAt ? new Date(body.visitedAt) : undefined,
          cropConfirmed: body.cropConfirmed,
          estimatedFarmSize: body.estimatedFarmSize,
          recommendation: body.recommendation,
          note: body.note,
          photos: body.photos ?? [],
        },
      }),
      this.prisma.loanApplication.update({
        where: { id },
        data: { status: LOAN_APPLICATION_STATUS.UnderReview },
      }),
      this.prisma.loanStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: app.status,
          toStatus: LOAN_APPLICATION_STATUS.UnderReview,
          changedBy: agent.id,
          reason: 'Field verification submitted',
        },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId: id,
          action: 'FIELD_VERIFICATION_SUBMITTED',
          performedById: agent.id,
          performedByRole: agent.role,
          details: {
            agentName: agentUser?.fullname,
            recommendation: body.recommendation,
          },
        },
      }),
      this.buildActivityLog({
        agentId: agent.id,
        action: AGENT_ACTION.SUBMIT_FIELD_VERIFICATION,
        description: 'Submitted field verification report',
        metadata: { recommendation: body.recommendation, applicationId: id },
        applicationId: id,
      }),
    ]);

    await this.notificationService.notifyAdmins({
      type: NOTIFICATION_TYPE.AGENT_VERIFICATION_SUBMITTED,
      title: 'Field Verification Submitted',
      message: `Agent ${agent.fullname ?? agent.username} has submitted a field verification report for application ${app.applicationRef}.`,
      resourceId: id,
      resourceType: 'loan_application',
    });

    return {
      status: true,
      message: 'Field verification submitted',
      data: null,
    };
  }

  async getAssignedApplications(agent: User) {
    const apps = await this.prisma.loanApplication.findMany({
      where: {
        agentId: agent.id,
        status: LOAN_APPLICATION_STATUS.PendingFieldVerification,
        user: {
          onboardedByAgentId: agent.id,
        },
      },
      include: { farm: true },
      orderBy: { updatedAt: 'asc' },
    });

    this.prisma.agentActivityLog
      .create({
        data: {
          agentId: agent.id,
          action: AGENT_ACTION.VIEW_ASSIGNED_APPLICATIONS,
          description: 'Viewed assigned loan applications',
          metadata: { resultCount: apps.length },
        },
      })
      .catch(() => {});

    return {
      status: true,
      message: 'Assigned applications retrieved',
      data: apps,
    };
  }

  async getAssignedFarmers(agent: User) {
    const farmers = await this.prisma.user.findMany({
      where: {
        onboardedByAgentId: agent.id,
        role: USER_ROLE.FARMER,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        phoneNumber: true,
        state: true,
        city: true,
        profileImageUrl: true,
        createdAt: true,
        loanApplications: {
          where: { agentId: agent.id },
          select: {
            id: true,
            applicationRef: true,
            status: true,
            fieldVerification: {
              select: {
                farmExists: true,
                visitedAt: true,
                cropConfirmed: true,
                estimatedFarmSize: true,
                recommendation: true,
                note: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { fullname: 'asc' },
    });

    return {
      status: true,
      message: 'Assigned farmers retrieved',
      data: farmers,
    };
  }

  async getActivityLogs(query: GetActivityLogsDto, caller: User) {
    const isAdmin = caller.role === USER_ROLE.ADMIN;
    const targetAgentId = isAdmin ? query.agentId : caller.id;

    if (isAdmin && !targetAgentId) {
      throw new BadRequestException(
        'agentId query param is required for admin access',
      );
    }

    const where: Prisma.AgentActivityLogWhereInput = {
      agentId: targetAgentId,
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const logs = await this.prisma.agentActivityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { status: true, message: 'Activity logs retrieved', data: logs };
  }

  // ─── Agent Onboarding Methods ──────────────────────────────────────────────

  async onboardFarmer(body: OnboardFarmerDto, agent: User) {
    // Check for duplicates
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: body.email },
          { username: body.username },
          { phoneNumber: body.phoneNumber },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User with this email, username, or phone number already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(
      String(body.password),
      this.BCRYPT_SALT_ROUNDS,
    );

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullname: body.fullname,
          username: body.username,
          phoneNumber: body.phoneNumber,
          email: body.email,
          password: hashedPassword,
          dateOfBirth: body.dateOfBirth,
          companyRegistrationNumber: body.companyRegistrationNumber,
          isBusinessRegistered: body.isBusinessRegistered ?? false,
          accountType: ACCOUNT_TYPE.FARMER,
          role: USER_ROLE.FARMER,
          currency: body.currency ?? 'NGN',
          onboardedByAgentId: agent.id,
          referralCode: await this.generateReferralCode(),
        },
      });

      // Create farm if provided
      if (body.farm) {
        await tx.farm.create({
          data: {
            userId: user.id,
            name: body.farm.name,
            address: body.farm.address,
            state: body.farm.state,
            lga: body.farm.lga,
            ownershipType: body.farm.ownershipType,
            mainCropType: body.farm.mainCropType,
            ward: body.farm.ward,
            latitude: body.farm.latitude,
            longitude: body.farm.longitude,
            sizeValue: body.farm.sizeValue,
            sizeUnit: body.farm.sizeUnit,
            secondaryCropType: body.farm.secondaryCropType,
            farmingSeason: body.farm.farmingSeason,
            expectedPlantingDate: body.farm.expectedPlantingDate
              ? new Date(body.farm.expectedPlantingDate)
              : undefined,
            expectedHarvestDate: body.farm.expectedHarvestDate
              ? new Date(body.farm.expectedHarvestDate)
              : undefined,
            hasIrrigation: body.farm.hasIrrigation ?? false,
          },
        });
      }

      return user;
    });

    // Log activity
    await this.prisma.agentActivityLog.create({
      data: {
        agentId: agent.id,
        action: AGENT_ACTION.ONBOARD_FARMER,
        description: `Onboarded farmer: ${newUser.fullname} (${newUser.email})`,
        metadata: { farmerId: newUser.id, farmerEmail: newUser.email },
      },
    });

    return {
      status: true,
      message: 'Farmer onboarded successfully',
      data: plainToInstance(UserEntity, newUser),
    };
  }

  async bulkOnboardFarmers(body: BulkOnboardFarmersDto, agent: User) {
    const results: Array<{
      index: number;
      email: string;
      status: 'success' | 'failed';
      message: string;
      data?: UserEntity;
    }> = [];

    for (let i = 0; i < body.farmers.length; i += 1) {
      const farmer = body.farmers[i];

      try {
        const response = await this.onboardFarmer(farmer, agent);
        results.push({
          index: i,
          email: farmer.email,
          status: 'success',
          message: response.message,
          data: response.data,
        });
      } catch (error) {
        const message =
          error instanceof BadRequestException ||
          error instanceof NotFoundException ||
          error instanceof ForbiddenException
            ? (error.getResponse() as any)?.message || error.message
            : 'Failed to onboard farmer';

        results.push({
          index: i,
          email: farmer.email,
          status: 'failed',
          message: Array.isArray(message) ? message.join(', ') : message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.length - successCount;

    return {
      status: failedCount === 0,
      message:
        failedCount === 0
          ? 'All farmers onboarded successfully'
          : 'Bulk onboarding completed with partial failures',
      data: results,
      meta: {
        total: results.length,
        successCount,
        failedCount,
      },
    };
  }

  async createFarmForFarmer(
    farmerId: string,
    body: CreateFarmForFarmerDto,
    agent: User,
  ) {
    // Verify farmer exists and was onboarded by this agent
    const farmer = await this.prisma.user.findFirst({
      where: {
        id: farmerId,
        role: USER_ROLE.FARMER,
        onboardedByAgentId: agent.id,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found or not onboarded by you');
    }

    const farm = await this.prisma.farm.create({
      data: {
        userId: farmerId,
        name: body.name,
        address: body.address,
        state: body.state,
        lga: body.lga,
        ownershipType: body.ownershipType,
        mainCropType: body.mainCropType,
        ward: body.ward,
        latitude: body.latitude,
        longitude: body.longitude,
        sizeValue: body.sizeValue,
        sizeUnit: body.sizeUnit,
        secondaryCropType: body.secondaryCropType,
        farmingSeason: body.farmingSeason,
        expectedPlantingDate: body.expectedPlantingDate
          ? new Date(body.expectedPlantingDate)
          : undefined,
        expectedHarvestDate: body.expectedHarvestDate
          ? new Date(body.expectedHarvestDate)
          : undefined,
        hasIrrigation: body.hasIrrigation ?? false,
      },
    });

    // Log activity
    await this.prisma.agentActivityLog.create({
      data: {
        agentId: agent.id,
        action: AGENT_ACTION.CREATE_FARM_FOR_FARMER,
        description: `Created farm "${body.name}" for farmer: ${farmer.fullname}`,
        metadata: { farmerId, farmId: farm.id, farmName: body.name },
      },
    });

    return {
      status: true,
      message: 'Farm created successfully',
      data: farm,
    };
  }

  async submitLoanForFarmer(body: SubmitLoanForFarmerDto, agent: User) {
    // Verify farmer exists and was onboarded by this agent
    const farmer = await this.prisma.user.findFirst({
      where: {
        id: body.farmerId,
        role: USER_ROLE.FARMER,
        onboardedByAgentId: agent.id,
      },
      include: { wallet: true },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found or not onboarded by you');
    }

    // Verify farm belongs to this farmer
    const farm = await this.prisma.farm.findFirst({
      where: {
        id: body.farmId,
        userId: body.farmerId,
      },
    });

    if (!farm) {
      throw new NotFoundException(
        'Farm not found or does not belong to this farmer',
      );
    }

    // Run eligibility checks
    const eligResult = await this.eligibility.runChecks(farmer, {
      farmId: body.farmId,
      season: body.season,
      plantingDate: body.expectedPlantingDate,
      fulfillmentMethod: body.fulfillmentMethod,
    });

    if (eligResult.eligible === 'fail') {
      throw new BadRequestException({
        status: false,
        message: 'Eligibility check failed',
        errors: eligResult.blockingIssues.map((issue) => ({
          field: 'eligibility',
          message: issue,
        })),
        data: eligResult,
      });
    }

    // Get farmer's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId: body.farmerId },
      include: {
        items: { include: { resource: { include: { category: true } } } },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Farmer cart is empty');
    }

    const totalEstimatedValue = Helpers.round2(
      cart.items.reduce(
        (sum, item) =>
          sum + Helpers.round2(item.resource.unitPrice * item.quantity),
        0,
      ),
    );

    const applicationRef = this.generateLoanRef();

    const application = await this.prisma.$transaction(async (tx) => {
      const app = await tx.loanApplication.create({
        data: {
          userId: body.farmerId,
          farmId: body.farmId,
          applicationRef,
          status: LOAN_APPLICATION_STATUS.Submitted,
          purpose: body.purpose,
          season: body.season,
          expectedPlantingDate: body.expectedPlantingDate
            ? new Date(body.expectedPlantingDate)
            : undefined,
          expectedHarvestDate: body.expectedHarvestDate
            ? new Date(body.expectedHarvestDate)
            : undefined,
          fulfillmentMethod: body.fulfillmentMethod,
          deliveryAddress: body.deliveryAddress,
          deliveryContact: body.deliveryContact,
          agentId: agent.id, // Agent who submitted on behalf of farmer
          farmerNotes: body.farmerNotes,
          totalEstimatedValue,
          submittedAt: new Date(),
        },
      });

      // Snapshot items
      await tx.loanApplicationItem.createMany({
        data: cart.items.map((item) => ({
          applicationId: app.id,
          resourceId: item.resourceId,
          itemName: item.resource.name,
          category: item.resource.category?.name,
          unitPrice: item.resource.unitPrice,
          quantity: item.quantity,
          unitOfMeasure: item.resource.unitOfMeasure,
          totalAmount: Helpers.round2(item.resource.unitPrice * item.quantity),
          supplier: item.resource.supplier,
        })),
      });

      // Persist eligibility checks
      await tx.eligibilityCheck.createMany({
        data: eligResult.checks.map((c) => ({
          applicationId: app.id,
          checkName: c.checkName,
          result: c.result,
          note: c.note,
          source: c.source ?? 'system',
        })),
      });

      // Append status history
      await tx.loanStatusHistory.create({
        data: {
          applicationId: app.id,
          toStatus: LOAN_APPLICATION_STATUS.Submitted,
          changedBy: agent.id,
          reason: 'Application submitted by agent on behalf of farmer',
        },
      });

      // Audit log
      await tx.loanAuditLog.create({
        data: {
          applicationId: app.id,
          action: 'APPLICATION_SUBMITTED_BY_AGENT',
          performedById: agent.id,
          performedByRole: agent.role,
          details: {
            eligibilityResult: eligResult.eligible,
            farmerId: body.farmerId,
          },
        },
      });

      // Clear cart after successful submission
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return app;
    });

    // Notify farmer
    await this.notificationService.create({
      userId: body.farmerId,
      type: NOTIFICATION_TYPE.LOAN_APPLICATION_SUBMITTED,
      title: 'Loan Application Submitted',
      message: `Your loan application ${applicationRef} has been submitted by your agent and is under review.`,
      resourceId: application.id,
      resourceType: 'loan_application',
    });

    // Notify admins
    await this.notificationService.notifyAdmins({
      type: NOTIFICATION_TYPE.NEW_LOAN_APPLICATION,
      title: 'New Loan Application',
      message: `A new loan application ${applicationRef} has been submitted by agent ${agent.fullname} on behalf of farmer ${farmer.fullname}.`,
      resourceId: application.id,
      resourceType: 'loan_application',
    });

    // Log activity
    await this.prisma.agentActivityLog.create({
      data: {
        agentId: agent.id,
        action: AGENT_ACTION.SUBMIT_LOAN_FOR_FARMER,
        description: `Submitted loan application ${applicationRef} for farmer: ${farmer.fullname}`,
        metadata: {
          farmerId: body.farmerId,
          applicationId: application.id,
          applicationRef,
        },
        applicationId: application.id,
      },
    });

    return {
      status: true,
      message: 'Loan application submitted successfully',
      data: { ...application, eligibility: eligResult },
    };
  }

  async submitLoanForFarmerFromMarketplace(
    farmerId: string,
    body: SubmitMarketplaceLoanForFarmerDto,
    agent: User,
  ) {
    // Primary endpoint under /agent/farmers/:farmerId/...;
    // delegates to legacy method for backward-compatible behavior.
    return this.submitLoanForFarmer(
      {
        farmerId,
        farmId: body.farmId,
        purpose: body.purpose,
        season: body.season,
        expectedPlantingDate: body.expectedPlantingDate,
        expectedHarvestDate: body.expectedHarvestDate,
        fulfillmentMethod: body.fulfillmentMethod,
        deliveryAddress: body.deliveryAddress,
        deliveryContact: body.deliveryContact,
        farmerNotes: body.farmerNotes,
        declarations: body.declarations,
      },
      agent,
    );
  }

  async getOnboardedFarmers(query: QueryOnboardedFarmersDto, agent: User) {
    const { loanStatus, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.UserWhereInput = {
      onboardedByAgentId: agent.id,
      role: USER_ROLE.FARMER,
    };

    const [farmers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullname: true,
          email: true,
          phoneNumber: true,
          state: true,
          city: true,
          profileImageUrl: true,
          createdAt: true,
          status: true,
          tierLevel: true,
          farms: {
            select: {
              id: true,
              name: true,
              address: true,
              state: true,
              mainCropType: true,
              sizeValue: true,
              sizeUnit: true,
            },
          },
          loanApplications: loanStatus
            ? {
                where: { status: loanStatus },
                select: {
                  id: true,
                  applicationRef: true,
                  status: true,
                  totalEstimatedValue: true,
                  createdAt: true,
                },
              }
            : {
                select: {
                  id: true,
                  applicationRef: true,
                  status: true,
                  totalEstimatedValue: true,
                  createdAt: true,
                },
              },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Log activity
    this.prisma.agentActivityLog
      .create({
        data: {
          agentId: agent.id,
          action: AGENT_ACTION.VIEW_ONBOARDED_FARMERS,
          description: 'Viewed onboarded farmers list',
          metadata: { resultCount: farmers.length },
        },
      })
      .catch(() => {});

    return {
      status: true,
      message: 'Onboarded farmers retrieved',
      data: farmers,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getOnboardedFarmersLoanApplications(
    query: QueryOnboardedFarmersDto,
    agent: User,
  ) {
    const { loanStatus, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get all farmers onboarded by this agent
    const onboardedFarmers = await this.prisma.user.findMany({
      where: {
        onboardedByAgentId: agent.id,
        role: USER_ROLE.FARMER,
      },
      select: { id: true },
    });

    const farmerIds = onboardedFarmers.map((f) => f.id);

    if (farmerIds.length === 0) {
      return {
        status: true,
        message: 'Loan applications retrieved',
        data: [],
        meta: { total: 0, page, limit, pages: 0 },
      };
    }

    const where: Prisma.LoanApplicationWhereInput = {
      userId: { in: farmerIds },
      ...(loanStatus && { status: loanStatus }),
    };

    const [applications, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullname: true,
              email: true,
              phoneNumber: true,
            },
          },
          farm: {
            select: {
              id: true,
              name: true,
              address: true,
              mainCropType: true,
            },
          },
          items: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      status: true,
      message: 'Loan applications retrieved',
      data: applications,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async verifyFarmerTier2Kyc(farmerId: string, body: KycTier2Dto, agent: User) {
    const farmer = await this.getOwnedFarmerOrThrow(farmerId, agent.id);
    const result = await this.userService.verifyTier2Kyc(body, farmer);

    await this.buildActivityLog({
      agentId: agent.id,
      action: AGENT_ACTION.VERIFY_FARMER_KYC_TIER2,
      description: `Verified Tier 2 KYC for farmer: ${farmer.fullname}`,
      metadata: { farmerId: farmer.id },
    });

    return result;
  }

  async verifyFarmerTier3Kyc(farmerId: string, body: KycTier3Dto, agent: User) {
    const farmer = await this.getOwnedFarmerOrThrow(farmerId, agent.id);
    const result = await this.userService.verifyTier3Kyc(body, farmer);

    await this.buildActivityLog({
      agentId: agent.id,
      action: AGENT_ACTION.VERIFY_FARMER_KYC_TIER3,
      description: `Verified Tier 3 KYC for farmer: ${farmer.fullname}`,
      metadata: { farmerId: farmer.id },
    });

    return result;
  }

  async getFarmerCart(farmerId: string, agent: User) {
    const farmer = await this.getOwnedFarmerOrThrow(farmerId, agent.id);
    const cart = await this.loanCartService.getCart(farmer);

    await this.buildActivityLog({
      agentId: agent.id,
      action: AGENT_ACTION.VIEW_FARMER_CART,
      description: `Viewed cart for farmer: ${farmer.fullname}`,
      metadata: { farmerId: farmer.id },
    });

    return cart;
  }

  async addFarmerCartItem(farmerId: string, body: AddCartItemDto, agent: User) {
    const farmer = await this.getOwnedFarmerOrThrow(farmerId, agent.id);
    const cart = await this.loanCartService.addItem(body, farmer);

    await this.buildActivityLog({
      agentId: agent.id,
      action: AGENT_ACTION.ADD_FARMER_CART_ITEM,
      description: `Added/updated cart item for farmer: ${farmer.fullname}`,
      metadata: {
        farmerId: farmer.id,
        resourceId: body.resourceId,
        quantity: body.quantity,
      },
    });

    return cart;
  }

  async updateFarmerCartItem(
    farmerId: string,
    itemId: string,
    body: UpdateCartItemDto,
    agent: User,
  ) {
    const farmer = await this.getOwnedFarmerOrThrow(farmerId, agent.id);
    const cart = await this.loanCartService.updateItem(itemId, body, farmer);

    await this.buildActivityLog({
      agentId: agent.id,
      action: AGENT_ACTION.UPDATE_FARMER_CART_ITEM,
      description: `Updated cart item for farmer: ${farmer.fullname}`,
      metadata: { farmerId: farmer.id, itemId, quantity: body.quantity },
    });

    return cart;
  }

  async removeFarmerCartItem(farmerId: string, itemId: string, agent: User) {
    const farmer = await this.getOwnedFarmerOrThrow(farmerId, agent.id);
    const cart = await this.loanCartService.removeItem(itemId, farmer);

    await this.buildActivityLog({
      agentId: agent.id,
      action: AGENT_ACTION.REMOVE_FARMER_CART_ITEM,
      description: `Removed cart item for farmer: ${farmer.fullname}`,
      metadata: { farmerId: farmer.id, itemId },
    });

    return cart;
  }

  async clearFarmerCart(farmerId: string, agent: User) {
    const farmer = await this.getOwnedFarmerOrThrow(farmerId, agent.id);
    const response = await this.loanCartService.clearCart(farmer);

    await this.buildActivityLog({
      agentId: agent.id,
      action: AGENT_ACTION.CLEAR_FARMER_CART,
      description: `Cleared cart for farmer: ${farmer.fullname}`,
      metadata: { farmerId: farmer.id },
    });

    return response;
  }

  async getOnboardedFarmerDetails(farmerId: string, agent: User) {
    // Verify farmer exists and was onboarded by this agent
    const farmer = await this.prisma.user.findFirst({
      where: {
        id: farmerId,
        role: USER_ROLE.FARMER,
        onboardedByAgentId: agent.id,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        username: true,
        phoneNumber: true,
        gender: true,
        country: true,
        state: true,
        city: true,
        address: true,
        dateOfBirth: true,
        profileImageUrl: true,
        status: true,
        tierLevel: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isBvnVerified: true,
        isNinVerified: true,
        isAddressVerified: true,
        bvn: true,
        nin: true,
        referralCode: true,
        currency: true,
        dailyCummulativeTransactionLimit: true,
        cummulativeBalanceLimit: true,
        createdAt: true,
        updatedAt: true,
        onboardedByAgentId: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found or not onboarded by you');
    }

    // Fetch all related data in parallel
    const [farms, wallet, loanApplications, agentActivityLogs] =
      await Promise.all([
        // Farms with photos
        this.prisma.farm.findMany({
          where: { userId: farmerId },
          include: {
            photos: true,
            applications: {
              select: { id: true, applicationRef: true, status: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Wallet info
        this.prisma.wallet.findFirst({
          where: { userId: farmerId },
          select: {
            id: true,
            balance: true,
            currency: true,
            accountNumber: true,
            accountName: true,
            bankName: true,
            bankCode: true,
            createdAt: true,
          },
        }),

        // All loan applications with full details
        this.prisma.loanApplication.findMany({
          where: { userId: farmerId },
          include: {
            farm: {
              select: {
                id: true,
                name: true,
                address: true,
                state: true,
                mainCropType: true,
                sizeValue: true,
                sizeUnit: true,
              },
            },
            items: true,
            eligibilityChecks: true,
            agentRecommendation: true,
            fieldVerification: true,
            decisions: {
              orderBy: { decidedAt: 'desc' },
            },
            statusHistory: {
              orderBy: { createdAt: 'asc' },
            },
            fulfillment: {
              include: {
                items: true,
              },
            },
            repaymentPlan: {
              include: {
                repayments: {
                  orderBy: { dueDate: 'asc' },
                },
              },
            },
            marketplaceOrders: {
              include: {
                items: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Agent activity logs related to this farmer
        this.prisma.agentActivityLog.findMany({
          where: {
            OR: [
              { metadata: { path: ['farmerId'], equals: farmerId } },
              { application: { userId: farmerId } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

    // Calculate loan statistics
    const loanStats = {
      totalApplications: loanApplications.length,
      totalValueRequested: loanApplications.reduce(
        (sum, app) => sum + (app.totalEstimatedValue || 0),
        0,
      ),
      activeLoans: loanApplications.filter(
        (app) =>
          app.status === LOAN_APPLICATION_STATUS.Active ||
          app.status === LOAN_APPLICATION_STATUS.PartiallyRepaid,
      ).length,
      completedLoans: loanApplications.filter(
        (app) => app.status === LOAN_APPLICATION_STATUS.Completed,
      ).length,
      pendingApplications: loanApplications.filter(
        (app) =>
          app.status === LOAN_APPLICATION_STATUS.Submitted ||
          app.status === LOAN_APPLICATION_STATUS.UnderReview ||
          app.status === LOAN_APPLICATION_STATUS.EligibilityReview ||
          app.status === LOAN_APPLICATION_STATUS.PendingFieldVerification ||
          app.status === LOAN_APPLICATION_STATUS.MoreInfoRequired,
      ).length,
      rejectedApplications: loanApplications.filter(
        (app) => app.status === LOAN_APPLICATION_STATUS.Rejected,
      ).length,
    };

    // Log activity
    this.prisma.agentActivityLog
      .create({
        data: {
          agentId: agent.id,
          action: AGENT_ACTION.VIEW_FARMER_DETAILS,
          description: `Viewed detailed profile for farmer: ${farmer.fullname}`,
          metadata: { farmerId: farmer.id },
        },
      })
      .catch(() => {});

    return {
      status: true,
      message: 'Farmer details retrieved',
      data: {
        farmer,
        farms,
        wallet,
        loanApplications,
        loanStats,
        agentActivityLogs,
      },
    };
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private generateReferralCode(): Promise<string> {
    return Promise.resolve(`UBI-${Helpers.getUniqueId().toUpperCase()}`);
  }

  private generateLoanRef(): string {
    const year = new Date().getFullYear();
    const unique = Helpers.getUniqueId().toUpperCase();
    return `UBI-${year}-${unique}`;
  }

  private buildActivityLog(params: {
    agentId: string;
    action: string;
    description: string;
    metadata?: Record<string, unknown>;
    applicationId?: string;
  }) {
    return this.prisma.agentActivityLog.create({
      data: {
        agentId: params.agentId,
        action: params.action,
        description: params.description,
        metadata:
          params.metadata !== undefined
            ? (params.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        applicationId: params.applicationId ?? null,
      },
    });
  }

  private async getOwnedFarmerOrThrow(farmerId: string, agentId: string) {
    const farmer = await this.prisma.user.findFirst({
      where: {
        id: farmerId,
        role: USER_ROLE.FARMER,
        onboardedByAgentId: agentId,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found or not onboarded by you');
    }

    return farmer;
  }

  async updateHomeAddress(body: UpdateHomeAddressDto, agent: User) {
    await this.prisma.user.update({
      where: { id: agent.id },
      data: {
        address: body.address,
        state: body.state,
        city: body.city,
        isAddressVerified: false,
      },
    });

    await this.buildActivityLog({
      agentId: agent.id,
      action: AGENT_ACTION.UPDATE_HOME_ADDRESS,
      description: 'Submitted home address for admin review',
    });

    return {
      message: 'Home address submitted for review',
      statusCode: HttpStatus.OK,
    };
  }
}
