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
import { USER_ROLE } from '@prisma/client';
import { Request } from 'express';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { LoanApplicationService } from './loan-application.service';
import {
  CreateLoanApplicationDto,
  CreateMarketplaceLoanApplicationDto,
  QueryLoanApplicationDto,
} from './dto';
import { EligibilityCheckDto } from 'src/loan-eligibility/dto';
import { loanApplicationResponse } from './loan-application.response';

@ApiTags('Loan Applications')
@Controller('v1/loan-applications')
export class LoanApplicationController {
  constructor(private readonly service: LoanApplicationService) {}

  @Post('eligibility-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run eligibility check before applying' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanApplicationResponse.eligibilityCheck,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    example: loanApplicationResponse.eligibilityCheckFailed,
  })
  async runEligibilityCheck(
    @Body() body: EligibilityCheckDto,
    @Req() req: Request,
  ) {
    return this.service.runEligibilityCheck(body, (req as any).user);
  }

  @Post('marketplace')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Primary: Submit a farm input loan application from marketplace-selected items',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: loanApplicationResponse.submitFromMarketplace,
  })
  async submitFromMarketplace(
    @Body() body: CreateMarketplaceLoanApplicationDto,
    @Req() req: Request,
  ) {
    return this.service.submitApplicationFromMarketplace(
      body,
      (req as any).user,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Legacy: Submit a farm input loan application (kept for backward compatibility)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: loanApplicationResponse.submit,
  })
  async submit(@Body() body: CreateLoanApplicationDto, @Req() req: Request) {
    return this.service.submitApplication(body, (req as any).user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my loan applications' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanApplicationResponse.getMyApplications,
  })
  async getMyApplications(
    @Query() query: QueryLoanApplicationDto,
    @Req() req: Request,
  ) {
    return this.service.getMyApplications((req as any).user, query);
  }

  @Get('history/previous-loans')
  @UseGuards(RolesGuard)
  @Roles(USER_ROLE.FARMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my previous loans history' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanApplicationResponse.getPreviousLoansHistory,
  })
  async getPreviousLoansHistory(
    @Query() query: QueryLoanApplicationDto,
    @Req() req: Request,
  ) {
    return this.service.getPreviousLoansHistory((req as any).user, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get application detail' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanApplicationResponse.getApplication,
  })
  async getApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.service.getApplication(id, (req as any).user);
  }

  @Get(':id/timeline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get application status timeline' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanApplicationResponse.getTimeline,
  })
  async getTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.service.getTimeline(id, (req as any).user);
  }

  @Get(':id/repayment-schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get repayment schedule for an active loan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanApplicationResponse.getRepaymentSchedule,
  })
  async getRepaymentSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.service.getRepaymentSchedule(id, (req as any).user);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a loan application (Draft or Submitted only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    example: loanApplicationResponse.cancel,
  })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.service.cancelApplication(id, (req as any).user);
  }
}
