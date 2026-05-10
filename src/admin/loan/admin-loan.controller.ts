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
import { AgentService } from 'src/agent/agent.service';
import { GetActivityLogsDto } from 'src/agent/dto';
import {
  AdminDecisionDto,
  AdminQueryAgentsDto,
  AdminQueryLoanDto,
  AssignAgentDto,
  CancelLoanDto,
  ManualStatusDto,
} from './dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { adminLoanResponse } from './admin-loan.response';

@ApiTags('Admin - Loans')
@Controller('v1/admin')
@UseGuards(RolesGuard)
export class AdminLoanController {
  constructor(
    private readonly service: AdminLoanService,
    private readonly agentService: AgentService,
  ) {}

  @Get('overview')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin dashboard overview stats' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.overview })
  async overview() {
    return this.service.getOverview();
  }

  @Get('agents')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all agents with their assigned farmers' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.listAgents })
  async listAgents(@Query() query: AdminQueryAgentsDto) {
    return this.service.listAgentsWithFarmers(query);
  }

  @Get('agents/:id/farmers-list')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List farmers assigned to an agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.getAgentFarmersList,
  })
  async getAgentFarmersList(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AdminQueryAgentsDto,
  ) {
    return this.service.getAgentFarmersList(id, query);
  }

  @Get('agents/:id/farmers/:farmerId/previous-loans')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get previous loans history for a farmer assigned to an agent',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.getAssignedFarmerPreviousLoans,
  })
  async getAssignedFarmerPreviousLoans(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Query() query: AdminQueryLoanDto,
  ) {
    return this.service.getAssignedFarmerPreviousLoans(id, farmerId, query);
  }

  @Get('agents/:id/applications')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List applications handled by an agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.getAgentApplications,
  })
  async getAgentApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AdminQueryLoanDto,
  ) {
    return this.service.getAgentApplications(id, query);
  }

  @Get('agents/:id/verification-tasks')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List verification tasks for an agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.getAgentVerificationTasks,
  })
  async getAgentVerificationTasks(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AdminQueryLoanDto,
  ) {
    return this.service.getAgentVerificationTasks(id, query);
  }

  @Get('agents/:id/performance')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get performance metrics for an agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.getAgentPerformance,
  })
  async getAgentPerformance(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAgentPerformance(id);
  }

  @Get('agents/:id/activity-log')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get activity log for an agent over a time range' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.getAgentActivityLog,
  })
  async getAgentActivityLog(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetActivityLogsDto,
    @Req() req: Request,
  ) {
    return this.agentService.getActivityLogs(
      { ...query, agentId: id },
      (req as any).user,
    );
  }

  @Get('agents/:id')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get agent profile with performance metrics' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.getAgent })
  async getAgent(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAgentById(id);
  }

  @Get('loan-applications')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all loan applications with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.listApplications,
  })
  async list(@Query() query: AdminQueryLoanDto) {
    return this.service.listApplications(query);
  }

  @Get('loan-applications/verification-queue')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get applications pending field verification' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.verificationQueue,
  })
  async verificationQueue(@Query() query: AdminQueryLoanDto) {
    return this.service.getVerificationQueue(query);
  }

  @Get('loan-applications/:id')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full application detail (all tabs)' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.getApplicationDetail,
  })
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getApplicationDetail(id);
  }

  @Post('loan-applications/:id/decision')
  @Roles(USER_ROLE.ADMIN)
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

  @Post('loan-applications/:id/approve')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a loan application with optional remarks' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.approve })
  async approveLoan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminDecisionDto,
    @Req() req: Request,
  ) {
    return this.service.approveLoan(id, body, (req as any).user);
  }

  @Post('loan-applications/:id/reject')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a loan application with remarks' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.reject })
  async rejectLoan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminDecisionDto,
    @Req() req: Request,
  ) {
    return this.service.rejectLoan(id, body, (req as any).user);
  }

  @Post('loan-applications/:id/cancel')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a loan application with remarks' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.cancel })
  async cancelLoan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CancelLoanDto,
    @Req() req: Request,
  ) {
    return this.service.cancelLoan(id, body, (req as any).user);
  }

  @Post('loan-applications/:id/assign-agent')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a field agent to an application' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.assignAgent,
  })
  async assignAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AssignAgentDto,
    @Req() req: Request,
  ) {
    return this.service.assignAgent(id, body, (req as any).user);
  }

  @Post('loan-applications/:id/status')
  @Roles(USER_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually update application status (validated transition)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.updateStatus,
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ManualStatusDto,
    @Req() req: Request,
  ) {
    return this.service.updateStatus(id, body, (req as any).user);
  }

  @Get('loan-applications/:id/audit-log')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full audit log for an application' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.auditLog })
  async auditLog(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAuditLog(id);
  }

  @Get('loan-reports/summary')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Loan portfolio summary report' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.summaryReport,
  })
  async summaryReport() {
    return this.service.getSummaryReport();
  }

  @Get('loan-reports/overdue')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all overdue loans' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminLoanResponse.overdueReport,
  })
  async overdueReport(@Query() query: AdminQueryLoanDto) {
    return this.service.getOverdueReport(query);
  }

  @Get('loan-reports/top-items')
  @Roles(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER_SUPPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Top 10 most requested loan resources' })
  @ApiResponse({ status: HttpStatus.OK, example: adminLoanResponse.topItems })
  async topItems() {
    return this.service.getTopRequestedItems();
  }
}
