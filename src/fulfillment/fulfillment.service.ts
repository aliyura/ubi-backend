import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanApplicationService } from 'src/loan-application/loan-application.service';
import { LoanNotificationService } from 'src/loan-application/loan-notification.service';
import {
  CreateFulfillmentDto,
  CreateSupplierDto,
  DeliverFulfillmentDto,
} from './dto';
import {
  FULFILLMENT_STATUS,
  LOAN_APPLICATION_STATUS,
  User,
} from '@prisma/client';
import { Helpers } from 'src/helpers';

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loanAppService: LoanApplicationService,
    private readonly notifications: LoanNotificationService,
  ) {}

  async createFulfillment(
    applicationId: string,
    body: CreateFulfillmentDto,
    admin: User,
  ) {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new NotFoundException('Application not found');
    this.loanAppService.validateTransition(
      app.status,
      LOAN_APPLICATION_STATUS.FulfillmentInProgress,
    );

    const fulfillmentRef = body.fulfillmentRef
      ?? `FUL-${new Date().getFullYear()}-${Helpers.getUniqueId().toUpperCase()}`;

    const fulfillment = await this.prisma.$transaction(async (tx) => {
      const f = await tx.fulfillment.create({
        data: {
          applicationId,
          supplierId: body.supplierId,
          fulfillmentRef,
          deliveryMethod: body.deliveryMethod,
          pickupAddress: body.pickupAddress,
          deliveryAddress: body.deliveryAddress,
          deliveryOfficer: body.deliveryOfficer,
          deliveryPhone: body.deliveryPhone,
          items: body.items
            ? { create: body.items }
            : undefined,
        },
        include: { items: true },
      });

      await tx.loanApplication.update({
        where: { id: applicationId },
        data: { status: LOAN_APPLICATION_STATUS.FulfillmentInProgress },
      });
      await tx.loanStatusHistory.create({
        data: {
          applicationId,
          fromStatus: app.status,
          toStatus: LOAN_APPLICATION_STATUS.FulfillmentInProgress,
          changedBy: admin.id,
          reason: 'Fulfillment created',
        },
      });
      await tx.loanAuditLog.create({
        data: {
          applicationId,
          action: 'FULFILLMENT_CREATED',
          performedById: admin.id,
          performedByRole: admin.role,
        },
      });

      return f;
    });

    const farmer = await this.prisma.user.findUnique({
      where: { id: app.userId },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyOnStatusChange(
        farmer.phoneNumber,
        LOAN_APPLICATION_STATUS.FulfillmentInProgress,
        app.applicationRef,
      );
    }

    return { status: true, message: 'Fulfillment created', data: fulfillment };
  }

  async dispatch(fulfillmentId: string, admin: User) {
    const fulfillment = await this.prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { application: true },
    });
    if (!fulfillment) throw new NotFoundException('Fulfillment not found');

    const app = fulfillment.application;
    const newStatus = fulfillment.deliveryMethod === 'pickup'
      ? LOAN_APPLICATION_STATUS.ReadyForPickup
      : LOAN_APPLICATION_STATUS.OutForDelivery;

    this.loanAppService.validateTransition(app.status, newStatus);

    await this.prisma.$transaction([
      this.prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: { status: FULFILLMENT_STATUS.dispatched, dispatchedAt: new Date() },
      }),
      this.prisma.loanApplication.update({
        where: { id: app.id },
        data: { status: newStatus },
      }),
      this.prisma.loanStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus: app.status,
          toStatus: newStatus,
          changedBy: admin.id,
          reason: 'Items dispatched',
        },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId: app.id,
          action: 'FULFILLMENT_DISPATCHED',
          performedById: admin.id,
          performedByRole: admin.role,
        },
      }),
    ]);

    const farmer = await this.prisma.user.findUnique({
      where: { id: app.userId },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyOnStatusChange(
        farmer.phoneNumber,
        newStatus,
        app.applicationRef,
      );
    }

    return { status: true, message: 'Dispatch recorded', data: null };
  }

  async deliver(fulfillmentId: string, body: DeliverFulfillmentDto, admin: User) {
    const fulfillment = await this.prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { application: true },
    });
    if (!fulfillment) throw new NotFoundException('Fulfillment not found');

    const app = fulfillment.application;
    this.loanAppService.validateTransition(app.status, LOAN_APPLICATION_STATUS.Delivered);

    await this.prisma.$transaction([
      this.prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: FULFILLMENT_STATUS.delivered,
          deliveredAt: new Date(),
          receivedBy: body.receivedBy,
          deliveryProofUrl: body.deliveryProofUrl,
          deliveryNote: body.deliveryNote,
        },
      }),
      // Transition through Delivered → Active in one atomic operation
      this.prisma.loanApplication.update({
        where: { id: app.id },
        data: { status: LOAN_APPLICATION_STATUS.Active },
      }),
      this.prisma.loanStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus: app.status,
          toStatus: LOAN_APPLICATION_STATUS.Delivered,
          changedBy: admin.id,
          reason: 'Items delivered',
        },
      }),
      this.prisma.loanStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus: LOAN_APPLICATION_STATUS.Delivered,
          toStatus: LOAN_APPLICATION_STATUS.Active,
          changedBy: admin.id,
          reason: 'Loan activated after delivery',
        },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId: app.id,
          action: 'FULFILLMENT_DELIVERED',
          performedById: admin.id,
          performedByRole: admin.role,
          details: { receivedBy: body.receivedBy },
        },
      }),
    ]);

    const farmer = await this.prisma.user.findUnique({
      where: { id: app.userId },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyOnStatusChange(
        farmer.phoneNumber,
        LOAN_APPLICATION_STATUS.Delivered,
        app.applicationRef,
      );
    }

    return { status: true, message: 'Delivery recorded', data: null };
  }

  async listFulfillments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.fulfillment.findMany({
        include: { application: true, supplier: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fulfillment.count(),
    ]);
    return {
      status: true,
      message: 'Fulfillments retrieved',
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async createSupplier(body: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({ data: body });
    return { status: true, message: 'Supplier created', data: supplier };
  }

  async listSuppliers() {
    const suppliers = await this.prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { status: true, message: 'Suppliers retrieved', data: suppliers };
  }
}
