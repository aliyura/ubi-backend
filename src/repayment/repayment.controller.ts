import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RepaymentService } from './repayment.service';
import { RecordRepaymentDto, AgentRepaymentQueryDto } from './dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { repaymentResponse } from './repayment.response';
import { Request } from 'express';

@ApiTags('Repayment')
@Controller('v1')
export class RepaymentController {
  constructor(private readonly service: RepaymentService) {}

  @Get('admin/repayments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: list all repayment plans' })
  @ApiResponse({ status: HttpStatus.OK, example: repaymentResponse.adminList })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  async adminList(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('overdueOnly') overdueOnly?: string,
  ) {
    return this.service.adminListRepayments(
      page,
      limit,
      overdueOnly === 'true',
    );
  }

  @Post('admin/repayments/:applicationId/record')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: record a manual repayment' })
  @ApiResponse({ status: HttpStatus.OK, example: repaymentResponse.record })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  async record(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() body: RecordRepaymentDto,
  ) {
    return this.service.recordRepayment(applicationId, body);
  }

  @Post('admin/repayments/jobs/process-overdue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: trigger overdue repayment processing job' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: repaymentResponse.processOverdue,
  })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  async processOverdue() {
    return this.service.processOverdueRepayments();
  }

  @Post('admin/repayments/jobs/send-reminders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: trigger repayment reminder SMS job' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: repaymentResponse.sendReminders,
  })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  async sendReminders() {
    return this.service.sendRepaymentReminders();
  }

  @Get('loan-applications/:id/repayment-schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Farmer: view repayment schedule for a loan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: repaymentResponse.getSchedule,
  })
  async getSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getRepaymentSchedule(id);
  }

  @Get('farmer/repayment-schedules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Farmer: view all repayment schedules across all loan applications',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    example: repaymentResponse.farmerGetAllSchedules,
  })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.FARMER)
  async farmerGetAllSchedules(@Req() req: Request) {
    return this.service.farmerGetAllRepaymentSchedules((req as any).user.id);
  }

  @Get('agent/repayment-schedules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Agent: view repayment schedules for assigned/onboarded farmers',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    example: repaymentResponse.agentGetAllSchedules,
  })
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.AGENT)
  async agentGetAllSchedules(
    @Query() query: AgentRepaymentQueryDto,
    @Req() req: Request,
  ) {
    return this.service.agentGetAllRepaymentSchedules((req as any).user, query);
  }
}
