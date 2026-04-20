import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanApplicationService } from 'src/loan-application/loan-application.service';
import { SubmitVerificationDto } from './dto';
import { LOAN_APPLICATION_STATUS, User } from '@prisma/client';

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
    return { status: true, message: 'Assigned applications retrieved', data: apps };
  }
}
