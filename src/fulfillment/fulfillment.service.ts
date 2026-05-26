import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanApplicationService } from 'src/loan-application/loan-application.service';
import { LoanNotificationService } from 'src/loan-application/loan-notification.service';
import { NotificationService } from 'src/notification/notification.service';
import {
  CreateFulfillmentDto,
  CreateSupplierDto,
  DeliverFulfillmentDto,
  ListFulfillmentsQueryDto,
} from './dto';
import {
  FULFILLMENT_STATUS,
  LOAN_APPLICATION_STATUS,
  NOTIFICATION_TYPE,
  User,
} from '@prisma/client';
import { Helpers } from 'src/helpers';

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loanAppService: LoanApplicationService,
    private readonly notifications: LoanNotificationService,
    private readonly notificationService: NotificationService,
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

    const fulfillmentRef =
      body.fulfillmentRef ??
      `FUL-${new Date().getFullYear()}-${Helpers.getUniqueId().toUpperCase()}`;

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
          items: body.items ? { create: body.items } : undefined,
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

    await this.notificationService.create({
      userId: app.userId,
      type: NOTIFICATION_TYPE.FULFILLMENT_IN_PROGRESS,
      title: 'Inputs Being Prepared',
      message: `Your farm inputs for application ${app.applicationRef} are being prepared.`,
      resourceId: app.id,
      resourceType: 'loan_application',
    });

    return { status: true, message: 'Fulfillment created', data: fulfillment };
  }

  async dispatch(fulfillmentId: string, admin: User) {
    const fulfillment = await this.prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { application: true },
    });
    if (!fulfillment) throw new NotFoundException('Fulfillment not found');

    const app = fulfillment.application;
    const newStatus =
      fulfillment.deliveryMethod === 'pickup'
        ? LOAN_APPLICATION_STATUS.ReadyForPickup
        : LOAN_APPLICATION_STATUS.OutForDelivery;

    this.loanAppService.validateTransition(app.status, newStatus);

    await this.prisma.$transaction([
      this.prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: FULFILLMENT_STATUS.dispatched,
          dispatchedAt: new Date(),
        },
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

    const dispatchNotificationType =
      newStatus === LOAN_APPLICATION_STATUS.ReadyForPickup
        ? NOTIFICATION_TYPE.FULFILLMENT_READY_FOR_PICKUP
        : NOTIFICATION_TYPE.FULFILLMENT_OUT_FOR_DELIVERY;
    const dispatchTitle =
      newStatus === LOAN_APPLICATION_STATUS.ReadyForPickup
        ? 'Inputs Ready for Pickup'
        : 'Inputs Out for Delivery';
    await this.notificationService.create({
      userId: app.userId,
      type: dispatchNotificationType,
      title: dispatchTitle,
      message: `Your farm inputs for application ${app.applicationRef} are ${newStatus === LOAN_APPLICATION_STATUS.ReadyForPickup ? 'ready for pickup' : 'out for delivery'}.`,
      resourceId: app.id,
      resourceType: 'loan_application',
    });

    return { status: true, message: 'Dispatch recorded', data: null };
  }

  async deliver(
    fulfillmentId: string,
    body: DeliverFulfillmentDto,
    admin: User,
  ) {
    const fulfillment = await this.prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { application: { include: { items: true } } },
    });
    if (!fulfillment) throw new NotFoundException('Fulfillment not found');

    const app = fulfillment.application;
    this.loanAppService.validateTransition(
      app.status,
      LOAN_APPLICATION_STATUS.Delivered,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const item of app.items) {
        const qty = item.approvedQuantity ?? item.quantity;
        const resource = await tx.loanResource.findUnique({
          where: { id: item.resourceId },
          select: { stockQuantity: true, name: true, unitOfMeasure: true },
        });
        if (!resource || resource.stockQuantity < qty) {
          throw new ConflictException(
            `Insufficient stock for "${item.itemName}". Available: ${resource?.stockQuantity ?? 0} ${item.unitOfMeasure}`,
          );
        }
        await tx.loanResource.update({
          where: { id: item.resourceId },
          data: { stockQuantity: { decrement: qty } },
        });
      }

      await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: FULFILLMENT_STATUS.delivered,
          deliveredAt: new Date(),
          receivedBy: body.receivedBy,
          deliveryProofUrl: body.deliveryProofUrl,
          deliveryNote: body.deliveryNote,
        },
      });
      // Transition through Delivered → Active in one atomic operation
      await tx.loanApplication.update({
        where: { id: app.id },
        data: { status: LOAN_APPLICATION_STATUS.Active },
      });
      await tx.loanStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus: app.status,
          toStatus: LOAN_APPLICATION_STATUS.Delivered,
          changedBy: admin.id,
          reason: 'Items delivered',
        },
      });
      await tx.loanStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus: LOAN_APPLICATION_STATUS.Delivered,
          toStatus: LOAN_APPLICATION_STATUS.Active,
          changedBy: admin.id,
          reason: 'Loan activated after delivery',
        },
      });
      await tx.loanAuditLog.create({
        data: {
          applicationId: app.id,
          action: 'FULFILLMENT_DELIVERED',
          performedById: admin.id,
          performedByRole: admin.role,
          details: { receivedBy: body.receivedBy },
        },
      });
    });

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

    await this.notificationService.create({
      userId: app.userId,
      type: NOTIFICATION_TYPE.FULFILLMENT_DELIVERED,
      title: 'Inputs Delivered',
      message: `Your farm inputs for application ${app.applicationRef} have been delivered. Your loan is now active.`,
      resourceId: app.id,
      resourceType: 'loan_application',
    });

    return { status: true, message: 'Delivery recorded', data: null };
  }

  async listFulfillments(query: ListFulfillmentsQueryDto) {
    const { page = 1, limit = 20, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.fulfillment.findMany({
        where,
        include: {
          application: true,
          supplier: true,
          items: { omit: { createdAt: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fulfillment.count({ where }),
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

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  async getClosestSuppliers(farmId: string, limit: number = 5) {
    // Get farm with location data
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    if (!farm) throw new NotFoundException('Farm not found');
    if (!farm.latitude || !farm.longitude) {
      throw new ConflictException('Farm location coordinates not available');
    }

    // Get all active suppliers with coordinates
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    if (suppliers.length === 0) {
      return {
        status: true,
        message: 'No active suppliers with location data available',
        data: {
          farm: {
            id: farm.id,
            name: farm.name,
            latitude: farm.latitude,
            longitude: farm.longitude,
          },
          suppliers: [],
        },
      };
    }

    // Calculate distances and sort
    const suppliersWithDistance = suppliers
      .map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        location: supplier.location,
        latitude: supplier.latitude,
        longitude: supplier.longitude,
        distance: this.calculateDistance(
          farm.latitude,
          farm.longitude,
          supplier.latitude!,
          supplier.longitude!,
        ),
        distanceUnit: 'km',
        contactPerson: supplier.contactPerson,
        contactPhone: supplier.contactPhone,
        contactEmail: supplier.contactEmail,
        deliveryCoverage: supplier.deliveryCoverage,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return {
      status: true,
      message: 'Closest suppliers retrieved',
      data: {
        farm: {
          id: farm.id,
          name: farm.name,
          latitude: farm.latitude,
          longitude: farm.longitude,
        },
        suppliers: suppliersWithDistance,
      },
    };
  }
}
