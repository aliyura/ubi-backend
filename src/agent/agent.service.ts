import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanApplicationService } from 'src/loan-application/loan-application.service';
import { AGENT_ACTION, GetActivityLogsDto, SubmitVerificationDto } from './dto';
import { LOAN_APPLICATION_STATUS, Prisma, USER_ROLE, User } from '@prisma/client';

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loanAppService: LoanApplicationService,
  ) {}

  async submitVerification(id: string, body: SubmitVerificationDto, agent: User) {
    const app = await this.prisma.loanApplication.findUnique({ where: { id } });
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
          details: { agentName: agentUser?.fullname, recommendation: body.recommendation },
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

    return { status: true, message: 'Field verification submitted', data: null };
  }

  async getAssignedApplications(agent: User) {
    const apps = await this.prisma.loanApplication.findMany({
      where: {
        agentId: agent.id,
        status: LOAN_APPLICATION_STATUS.PendingFieldVerification,
      },
      include: { farm: true },
      orderBy: { updatedAt: 'asc' },
    });

    this.prisma.agentActivityLog.create({
      data: {
        agentId: agent.id,
        action: AGENT_ACTION.VIEW_ASSIGNED_APPLICATIONS,
        description: 'Viewed assigned loan applications',
        metadata: { resultCount: apps.length },
      },
    }).catch(() => {});

    return { status: true, message: 'Assigned applications retrieved', data: apps };
  }

  async getAssignedFarmers(agent: User) {
    const farmers = await this.prisma.user.findMany({
      where: {
        loanApplications: {
          some: { agentId: agent.id },
        },
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

    return { status: true, message: 'Assigned farmers retrieved', data: farmers };
  }

  async getActivityLogs(query: GetActivityLogsDto, caller: User) {
    const isAdmin = caller.role === USER_ROLE.ADMIN;
    const targetAgentId = isAdmin ? query.agentId : caller.id;

    if (isAdmin && !targetAgentId) {
      throw new BadRequestException('agentId query param is required for admin access');
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
        metadata: params.metadata !== undefined ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        applicationId: params.applicationId ?? null,
      },
    });
  }
}
