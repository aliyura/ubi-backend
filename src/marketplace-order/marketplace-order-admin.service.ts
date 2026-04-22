import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanNotificationService } from 'src/loan-application/loan-notification.service';
import {
  AdminCancelOrderDto,
  AdminConfirmOrderDto,
  AdminDeliverOrderDto,
  AdminDispatchOrderDto,
  QueryMarketplaceOrderDto,
} from './dto';
import { MARKETPLACE_ORDER_STATUS, User } from '@prisma/client';

@Injectable()
export class MarketplaceOrderAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: LoanNotificationService,
  ) {}

  async listOrders(query: QueryMarketplaceOrderDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.applicationId) where.applicationId = query.applicationId;
    if (query.userId) where.userId = query.userId;

    const [items, total] = await Promise.all([
      this.prisma.marketplaceOrder.findMany({
        where,
        include: { items: true, supplier: true, application: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceOrder.count({ where }),
    ]);

    return {
      status: true,
      message: 'Orders retrieved',
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getOrderDetail(orderId: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { resource: true } },
        supplier: true,
        application: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return { status: true, message: 'Order retrieved', data: order };
  }

  async confirmOrder(orderId: string, body: AdminConfirmOrderDto, admin: User) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: { items: true, application: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== MARKETPLACE_ORDER_STATUS.pending) {
      throw new BadRequestException('Only pending orders can be confirmed');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const resource = await tx.loanResource.findUnique({
          where: { id: item.resourceId },
        });
        if (!resource || resource.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${item.itemName}" to confirm order`,
          );
        }
        await tx.loanResource.update({
          where: { id: item.resourceId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      await tx.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: MARKETPLACE_ORDER_STATUS.confirmed,
          supplierId: body.supplierId,
          adminNote: body.adminNote,
        },
      });

      await tx.loanAuditLog.create({
        data: {
          applicationId: order.applicationId,
          action: 'MARKETPLACE_ORDER_CONFIRMED',
          performedById: admin.id,
          performedByRole: admin.role,
          details: { orderRef: order.orderRef },
        },
      });
    });

    const farmer = await this.prisma.user.findUnique({
      where: { id: order.userId },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyMarketplaceOrderStatus(
        farmer.phoneNumber,
        MARKETPLACE_ORDER_STATUS.confirmed,
        order.orderRef,
      );
    }

    return { status: true, message: 'Order confirmed and stock reserved', data: null };
  }

  async packOrder(orderId: string, admin: User) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== MARKETPLACE_ORDER_STATUS.confirmed) {
      throw new BadRequestException('Only confirmed orders can be marked as packed');
    }

    await this.prisma.$transaction([
      this.prisma.marketplaceOrder.update({
        where: { id: orderId },
        data: { status: MARKETPLACE_ORDER_STATUS.packed },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId: order.applicationId,
          action: 'MARKETPLACE_ORDER_PACKED',
          performedById: admin.id,
          performedByRole: admin.role,
          details: { orderRef: order.orderRef },
        },
      }),
    ]);

    return { status: true, message: 'Order marked as packed', data: null };
  }

  async dispatchOrder(orderId: string, body: AdminDispatchOrderDto, admin: User) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== MARKETPLACE_ORDER_STATUS.packed) {
      throw new BadRequestException('Only packed orders can be dispatched');
    }

    await this.prisma.$transaction([
      this.prisma.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: MARKETPLACE_ORDER_STATUS.dispatched,
          dispatchedAt: new Date(),
          adminNote: body.adminNote ?? order.adminNote,
        },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId: order.applicationId,
          action: 'MARKETPLACE_ORDER_DISPATCHED',
          performedById: admin.id,
          performedByRole: admin.role,
          details: { orderRef: order.orderRef },
        },
      }),
    ]);

    const farmer = await this.prisma.user.findUnique({
      where: { id: order.userId },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyMarketplaceOrderStatus(
        farmer.phoneNumber,
        MARKETPLACE_ORDER_STATUS.dispatched,
        order.orderRef,
      );
    }

    return { status: true, message: 'Order dispatched', data: null };
  }

  async deliverOrder(orderId: string, body: AdminDeliverOrderDto, admin: User) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== MARKETPLACE_ORDER_STATUS.dispatched) {
      throw new BadRequestException('Only dispatched orders can be marked as delivered');
    }

    await this.prisma.$transaction([
      this.prisma.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: MARKETPLACE_ORDER_STATUS.delivered,
          deliveredAt: new Date(),
          receivedBy: body.receivedBy,
          deliveryProofUrl: body.deliveryProofUrl,
          deliveryNote: body.deliveryNote,
        },
      }),
      this.prisma.loanAuditLog.create({
        data: {
          applicationId: order.applicationId,
          action: 'MARKETPLACE_ORDER_DELIVERED',
          performedById: admin.id,
          performedByRole: admin.role,
          details: { orderRef: order.orderRef, receivedBy: body.receivedBy },
        },
      }),
    ]);

    const farmer = await this.prisma.user.findUnique({
      where: { id: order.userId },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyMarketplaceOrderStatus(
        farmer.phoneNumber,
        MARKETPLACE_ORDER_STATUS.delivered,
        order.orderRef,
      );
    }

    return { status: true, message: 'Delivery recorded', data: null };
  }

  async cancelOrder(orderId: string, body: AdminCancelOrderDto, admin: User) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const cancellable: MARKETPLACE_ORDER_STATUS[] = [
      MARKETPLACE_ORDER_STATUS.pending,
      MARKETPLACE_ORDER_STATUS.confirmed,
    ];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException('Only pending or confirmed orders can be cancelled');
    }

    await this.prisma.$transaction(async (tx) => {
      if (order.status === MARKETPLACE_ORDER_STATUS.confirmed) {
        for (const item of order.items) {
          await tx.loanResource.update({
            where: { id: item.resourceId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }

      await tx.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: MARKETPLACE_ORDER_STATUS.cancelled,
          cancelledAt: new Date(),
          cancelReason: body.cancelReason,
        },
      });

      await tx.loanAuditLog.create({
        data: {
          applicationId: order.applicationId,
          action: 'MARKETPLACE_ORDER_CANCELLED_BY_ADMIN',
          performedById: admin.id,
          performedByRole: admin.role,
          details: { orderRef: order.orderRef, reason: body.cancelReason },
        },
      });
    });

    const farmer = await this.prisma.user.findUnique({
      where: { id: order.userId },
      select: { phoneNumber: true },
    });
    if (farmer) {
      await this.notifications.notifyMarketplaceOrderStatus(
        farmer.phoneNumber,
        MARKETPLACE_ORDER_STATUS.cancelled,
        order.orderRef,
      );
    }

    return { status: true, message: 'Order cancelled', data: null };
  }
}
