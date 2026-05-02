import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanNotificationService } from 'src/loan-application/loan-notification.service';
import { NotificationService } from 'src/notification/notification.service';
import { PlaceMarketplaceOrderDto, QueryMarketplaceOrderDto } from './dto';
import {
  LOAN_APPLICATION_STATUS,
  MARKETPLACE_ORDER_STATUS,
  NOTIFICATION_TYPE,
  User,
} from '@prisma/client';
import { Helpers } from 'src/helpers';

const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  phoneNumber: true,
  fullname: true,
  gender: true,
  country: true,
  role: true,
  accountType: true,
  currency: true,
  businessName: true,
  isBusiness: true,
  companyRegistrationNumber: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  isBvnVerified: true,
  isNinVerified: true,
  isAddressVerified: true,
  isPasscodeSet: true,
  isWalletPinSet: true,
  address: true,
  state: true,
  city: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class MarketplaceOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: LoanNotificationService,
    private readonly notificationService: NotificationService,
  ) {}

  private generateOrderRef(): string {
    const year = new Date().getFullYear();
    const unique = Helpers.getUniqueId().toUpperCase();
    return `MKT-${year}-${unique}`;
  }

  async getCreditSummary(applicationId: string, user: User) {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.userId !== user.id) throw new ForbiddenException();

    const decision = await this.prisma.loanDecision.findFirst({
      where: { applicationId, decision: 'approved' },
      orderBy: { decidedAt: 'desc' },
    });
    if (!decision) throw new BadRequestException('No approved decision found for this application');

    const aggregate = await this.prisma.marketplaceOrder.aggregate({
      where: {
        applicationId,
        status: { notIn: [MARKETPLACE_ORDER_STATUS.cancelled] },
      },
      _sum: { totalAmount: true },
    });

    const approved = decision.approvedTotalValue ?? 0;
    const spent = aggregate._sum.totalAmount ?? 0;

    return {
      status: true,
      message: 'Credit summary retrieved',
      data: {
        applicationRef: app.applicationRef,
        approved,
        spent,
        available: Helpers.round2(approved - spent),
      },
    };
  }

  async placeOrder(applicationId: string, body: PlaceMarketplaceOrderDto, user: User) {
    const order = await this.prisma.$transaction(
      async (tx) => {
        const app = await tx.loanApplication.findUnique({
          where: { id: applicationId },
        });
        if (!app) throw new NotFoundException('Application not found');
        if (app.userId !== user.id) throw new ForbiddenException();
        if (app.status !== LOAN_APPLICATION_STATUS.Approved) {
          throw new BadRequestException(
            'Marketplace orders can only be placed on an Approved loan',
          );
        }

        const decision = await tx.loanDecision.findFirst({
          where: { applicationId, decision: 'approved' },
          orderBy: { decidedAt: 'desc' },
        });
        if (!decision) throw new BadRequestException('No approved decision found');

        const aggregate = await tx.marketplaceOrder.aggregate({
          where: {
            applicationId,
            status: { notIn: [MARKETPLACE_ORDER_STATUS.cancelled] },
          },
          _sum: { totalAmount: true },
        });

        const approved = decision.approvedTotalValue ?? 0;
        const alreadySpent = aggregate._sum.totalAmount ?? 0;
        const availableCredit = Helpers.round2(approved - alreadySpent);

        const resolvedItems: Array<{
          resourceId: string;
          itemName: string;
          category: string | null;
          unitPrice: number;
          quantity: number;
          unitOfMeasure: string;
          totalAmount: number;
          supplier: string | null;
        }> = [];

        for (const item of body.items) {
          const resource = await tx.loanResource.findUnique({
            where: { id: item.resourceId },
            include: { category: true },
          });
          if (!resource || !resource.isActive || !resource.isEligibleForLoan) {
            throw new BadRequestException(
              `Resource ${item.resourceId} is not available for loan`,
            );
          }
          if (resource.stockQuantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for "${resource.name}". Available: ${resource.stockQuantity} ${resource.unitOfMeasure}`,
            );
          }
          resolvedItems.push({
            resourceId: resource.id,
            itemName: resource.name,
            category: resource.category?.name ?? null,
            unitPrice: resource.unitPrice,
            quantity: item.quantity,
            unitOfMeasure: resource.unitOfMeasure,
            totalAmount: Helpers.round2(resource.unitPrice * item.quantity),
            supplier: resource.supplier ?? null,
          });
        }

        const orderTotal = Helpers.round2(resolvedItems.reduce((sum, i) => sum + i.totalAmount, 0));
        if (orderTotal > availableCredit) {
          throw new BadRequestException(
            `Order total (${orderTotal.toFixed(2)}) exceeds remaining loan credit (${availableCredit.toFixed(2)})`,
          );
        }

        const orderRef = this.generateOrderRef();

        const created = await tx.marketplaceOrder.create({
          data: {
            applicationId,
            userId: user.id,
            orderRef,
            totalAmount: orderTotal,
            deliveryMethod: body.deliveryMethod,
            deliveryAddress: body.deliveryAddress,
            deliveryContact: body.deliveryContact,
            pickupAddress: body.pickupAddress,
            items: { create: resolvedItems },
          },
          include: { items: true },
        });

        await tx.loanAuditLog.create({
          data: {
            applicationId,
            action: 'MARKETPLACE_ORDER_PLACED',
            performedById: user.id,
            performedByRole: user.role,
            details: { orderRef, totalAmount: orderTotal },
          },
        });

        return { created, app };
      },
      { isolationLevel: 'Serializable' },
    );

    const [farmer, userInfo] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: { phoneNumber: true },
      }),
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: USER_SELECT,
      }),
    ]);
    if (farmer) {
      await this.notifications.notifyMarketplaceOrderStatus(
        farmer.phoneNumber,
        MARKETPLACE_ORDER_STATUS.pending,
        order.created.orderRef,
      );
    }

    await this.notificationService.create({
      userId: user.id,
      type: NOTIFICATION_TYPE.ORDER_PLACED,
      title: 'Order Placed',
      message: `Your marketplace order ${order.created.orderRef} has been placed and is awaiting confirmation.`,
      resourceId: order.created.id,
      resourceType: 'marketplace_order',
    });

    await this.notificationService.notifyAdmins({
      type: NOTIFICATION_TYPE.NEW_MARKETPLACE_ORDER,
      title: 'New Marketplace Order',
      message: `A new marketplace order ${order.created.orderRef} has been placed and requires confirmation.`,
      resourceId: order.created.id,
      resourceType: 'marketplace_order',
    });

    return {
      status: true,
      message: 'Marketplace order placed successfully',
      data: { ...order.created, user: userInfo },
    };
  }

  async listMyOrders(
    applicationId: string,
    user: User,
    query: QueryMarketplaceOrderDto,
  ) {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.userId !== user.id) throw new ForbiddenException();

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const orderWhere = {
      applicationId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total, userInfo] = await Promise.all([
      this.prisma.marketplaceOrder.findMany({
        where: orderWhere,
        include: { items: true, supplier: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceOrder.count({ where: orderWhere }),
      this.prisma.user.findUnique({ where: { id: user.id }, select: USER_SELECT }),
    ]);

    return {
      status: true,
      message: 'Orders retrieved',
      data: items.map((item) => ({ ...item, user: userInfo })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getMyOrder(applicationId: string, orderId: string, user: User) {
    const [order, userInfo] = await Promise.all([
      this.prisma.marketplaceOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { resource: true } }, supplier: true },
      }),
      this.prisma.user.findUnique({ where: { id: user.id }, select: USER_SELECT }),
    ]);
    if (!order || order.applicationId !== applicationId)
      throw new NotFoundException('Order not found');
    if (order.userId !== user.id) throw new ForbiddenException();

    return { status: true, message: 'Order retrieved', data: { ...order, user: userInfo } };
  }

  async cancelMyOrder(applicationId: string, orderId: string, user: User) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order || order.applicationId !== applicationId)
      throw new NotFoundException('Order not found');
    if (order.userId !== user.id) throw new ForbiddenException();
    if (order.status !== MARKETPLACE_ORDER_STATUS.pending) {
      throw new BadRequestException(
        'Only pending orders can be cancelled by the farmer',
      );
    }

    await this.prisma.$transaction([
      this.prisma.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: MARKETPLACE_ORDER_STATUS.cancelled,
          cancelledAt: new Date(),
          cancelReason: 'Cancelled by farmer',
        },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId,
          action: 'MARKETPLACE_ORDER_CANCELLED_BY_FARMER',
          performedById: user.id,
          performedByRole: user.role,
          details: { orderRef: order.orderRef },
        },
      }),
    ]);

    const farmer = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyMarketplaceOrderStatus(
        farmer.phoneNumber,
        MARKETPLACE_ORDER_STATUS.cancelled,
        order.orderRef,
      );
    }

    await this.notificationService.create({
      userId: user.id,
      type: NOTIFICATION_TYPE.ORDER_CANCELLED,
      title: 'Order Cancelled',
      message: `Your marketplace order ${order.orderRef} has been cancelled.`,
      resourceId: orderId,
      resourceType: 'marketplace_order',
    });

    return { status: true, message: 'Order cancelled', data: null };
  }
}
