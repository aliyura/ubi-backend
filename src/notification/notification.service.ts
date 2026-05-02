import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NOTIFICATION_TYPE } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryNotificationsDto } from './dto';

interface CreateNotificationPayload {
  userId: string;
  type: NOTIFICATION_TYPE;
  title: string;
  message: string;
  resourceId?: string;
  resourceType?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateNotificationPayload): Promise<void> {
    try {
      await this.prisma.notification.create({ data: payload });
    } catch (err) {
      this.logger.error('Failed to create in-app notification', err?.message);
    }
  }

  async getNotifications(userId: string, query: QueryNotificationsDto) {
    const { page = 1, limit = 20, isRead } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId };
    if (typeof isRead === 'boolean') where.isRead = isRead;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      status: true,
      message: 'Notifications retrieved',
      data: items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId)
      throw new ForbiddenException('Access denied');

    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return { status: true, message: 'Notification marked as read', data: null };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return {
      status: true,
      message: 'All notifications marked as read',
      data: null,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { status: true, message: 'Unread count retrieved', data: { count } };
  }
}
