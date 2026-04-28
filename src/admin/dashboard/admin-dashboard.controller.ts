import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from './admin-dashboard.service';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { adminDashboardResponse } from './admin-dashboard.response';
import { AccountRegistryQueryDto, DateRangeDto, PaginationDto, TransactionsHistoryQueryDto } from './admin-dashboard.dto';

@ApiTags('Admin - Dashboard')
@Controller('v1/admin/dashboard')
@UseGuards(RolesGuard)
@Roles(USER_ROLE.ADMIN)
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dashboard summary: active farmers, agents, loan volume, pending verifications' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.summary })
  async summary(@Query() query: DateRangeDto) {
    return this.service.getSummary(query);
  }

  @Get('monthly-onboarding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Monthly farmer onboarding counts for the given date range' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.monthlyOnboarding })
  async monthlyOnboarding(@Query() query: DateRangeDto) {
    return this.service.getMonthlyOnboarding(query);
  }

  @Get('loan-disbursement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quarterly loans requested vs disbursed for the given date range' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.loanDisbursement })
  async loanDisbursement(@Query() query: DateRangeDto) {
    return this.service.getLoanDisbursement(query);
  }

  @Get('crop-distribution')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Crop distribution: main crop types as % of total farms with total hectares' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.cropDistribution })
  async cropDistribution(@Query() query: DateRangeDto) {
    return this.service.getCropDistribution(query);
  }

  @Get('agent-performance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Top 3 agents by farmers onboarded with total loan volume disbursed' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.agentPerformance })
  async agentPerformance(@Query() query: DateRangeDto) {
    return this.service.getAgentPerformance(query);
  }

  @Get('users-overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Users overview: total customers, active now, verified (KYC level > 1), flagged' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.usersOverview })
  async usersOverview() {
    return this.service.getUsersOverview();
  }

  @Get('recent-active-users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paginated list of users sorted by most recent transaction activity' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.recentActiveUsers })
  async recentActiveUsers(@Query() query: PaginationDto) {
    return this.service.getRecentActiveUsers(query);
  }

  @Get('loan-overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Loan overview: total applications, pending verifications, approved loans sum, overdue loans sum' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.loanOverview })
  async loanOverview() {
    return this.service.getLoanOverview();
  }

  @Get('accounts-overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wallet accounts overview: total accounts, active accounts, total deposit volume' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.accountsOverview })
  async accountsOverview() {
    return this.service.getAccountsOverview();
  }

  @Get('account-registry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search wallet accounts by account number, BVN, or customer name' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.accountRegistry })
  async accountRegistry(@Query() query: AccountRegistryQueryDto) {
    return this.service.getAccountRegistry(query);
  }

  @Get('transactions-overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transactions overview: total volume, count, success %, failure % for the given date range' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.transactionsOverview })
  async transactionsOverview(@Query() query: DateRangeDto) {
    return this.service.getTransactionsOverview(query);
  }

  @Get('transactions-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paginated transaction history filtered by reference, type, or category' })
  @ApiResponse({ status: HttpStatus.OK, example: adminDashboardResponse.transactionsHistory })
  async transactionsHistory(@Query() query: TransactionsHistoryQueryDto) {
    return this.service.getTransactionsHistory(query);
  }
}
