import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { USER_ROLE } from '@prisma/client';
import { Request } from 'express';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { QueryNotificationsDto } from './dto';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('v1/notifications')
@UseGuards(RolesGuard)
@Roles(USER_ROLE.FARMER, USER_ROLE.AGENT)
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my notifications (paginated)' })
  @ApiResponse({ status: HttpStatus.OK })
  async getNotifications(
    @Query() query: QueryNotificationsDto,
    @Req() req: Request,
  ) {
    return this.service.getNotifications((req as any).user.id, query);
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({ status: HttpStatus.OK })
  async getUnreadCount(@Req() req: Request) {
    return this.service.getUnreadCount((req as any).user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: HttpStatus.OK })
  async markAllAsRead(@Req() req: Request) {
    return this.service.markAllAsRead((req as any).user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: HttpStatus.OK })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.service.markAsRead(id, (req as any).user.id);
  }
}
