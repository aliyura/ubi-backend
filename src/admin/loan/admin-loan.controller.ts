import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminLoanService } from './admin-loan.service';
import {
  AdminDecisionDto,
  AdminQueryAgentsDto,
  AdminQueryLoanDto,
  AssignAgentDto,
  ManualStatusDto,
} from './dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { adminLoanResponse } from './admin-loan.response';

@ApiTags('Admin - Loans')
@Controller('v1/admin')
@UseGuards(RolesGuard)
@Roles(USER_ROLE.ADMIN)
export class AdminLoanController {
  constructor(private readonly service: AdminLoanService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin dashboard overview stats' })
  async overview() {
    return this.service.getOverview();
  }

  @Get('agents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all agents with their assigned farmers' })
  async listAgents(@Query() query: AdminQueryAgentsDto) {
    return this.service.listAgentsWithFarmers(query);
  }

  @Get('agents/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get agent profile with performance metrics' })
  async getAgent(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAgentById(id);
  }

  @Get('loan-applications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all loan applications with filters' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.listApplications })
  async list(@Query() query: AdminQueryLoanDto) {
    return this.service.listApplications(query);
  }

  @Get('loan-applications/verification-queue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get applications pending field verification' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.verificationQueue })
  async verificationQueue(@Query() query: AdminQueryLoanDto) {
    return this.service.getVerificationQueue(query);
  }

  @Get('loan-applications/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full application detail (all tabs)' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.getApplicationDetail })
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getApplicationDetail(id);
  }

  @Post('loan-applications/:id/decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve / reject / hold / request more info' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.decision })
  async decision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminDecisionDto,
    @Req() req: Request,
  ) {
    return this.service.makeDecision(id, body, (req as any).user);
  }

  @Post('loan-applications/:id/assign-agent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a field agent to an application' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.assignAgent })
  async assignAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AssignAgentDto,
    @Req() req: Request,
  ) {
    return this.service.assignAgent(id, body, (req as any).user);
  }

  @Post('loan-applications/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually update application status (validated transition)' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.updateStatus })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ManualStatusDto,
    @Req() req: Request,
  ) {
    return this.service.updateStatus(id, body, (req as any).user);
  }

  @Get('loan-applications/:id/audit-log')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full audit log for an application' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.auditLog })
  async auditLog(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAuditLog(id);
  }

  @Get('loan-reports/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Loan portfolio summary report' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.summaryReport })
  async summaryReport() {
    return this.service.getSummaryReport();
  }

  @Get('loan-reports/overdue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all overdue loans' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.overdueReport })
  async overdueReport(@Query() query: AdminQueryLoanDto) {
    return this.service.getOverdueReport(query);
  }

  @Get('loan-reports/top-items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Top 10 most requested loan resources' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.topItems })
  async topItems() {
    return this.service.getTopRequestedItems();
  }
}
