import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AgentService } from './agent.service';
import {
  AddCartItemDto,
  UpdateCartItemDto,
  GetActivityLogsDto,
  SubmitVerificationDto,
  OnboardFarmerDto,
  BulkOnboardFarmersDto,
  CreateFarmForFarmerDto,
  SubmitLoanForFarmerDto,
  SubmitMarketplaceLoanForFarmerDto,
  QueryOnboardedFarmersDto,
} from './dto';
import { KycTier2Dto, KycTier3Dto } from 'src/user/dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { agentResponse } from './agent.response';

@ApiTags('Agent')
@Controller('v1/agent')
@UseGuards(RolesGuard)
@Roles(USER_ROLE.AGENT, USER_ROLE.ADMIN)
export class AgentController {
  constructor(private readonly service: AgentService) {}

  @Get('loan-applications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get applications assigned to me for field verification',
  })
  @ApiResponse({ status: HttpStatus.OK, example: agentResponse.getAssigned })
  async getAssigned(@Req() req: Request) {
    return this.service.getAssignedApplications((req as any).user);
  }

  @Post('loan-applications/:id/verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit field verification report' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.submitVerification,
  })
  async submitVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SubmitVerificationDto,
    @Req() req: Request,
  ) {
    return this.service.submitVerification(id, body, (req as any).user);
  }

  @Get('farmers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get farmers assigned to the logged-in agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.getAssignedFarmers,
  })
  async getAssignedFarmers(@Req() req: Request) {
    return this.service.getAssignedFarmers((req as any).user);
  }

  @Get('activity-logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get agent activity logs for a time range (admin must supply ?agentId=)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.getActivityLogs,
  })
  async getActivityLogs(
    @Query() query: GetActivityLogsDto,
    @Req() req: Request,
  ) {
    return this.service.getActivityLogs(query, (req as any).user);
  }

  // ─── Agent Onboarding Endpoints ─────────────────────────────────────────────

  @Post('farmers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Onboard a new farmer (creates farmer account and optional farm)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: agentResponse.onboardFarmer,
  })
  async onboardFarmer(@Body() body: OnboardFarmerDto, @Req() req: Request) {
    return this.service.onboardFarmer(body, (req as any).user);
  }

  @Post('farmers/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Onboard many farmers in one request',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: agentResponse.bulkOnboardFarmers,
  })
  async bulkOnboardFarmers(
    @Body() body: BulkOnboardFarmersDto,
    @Req() req: Request,
  ) {
    return this.service.bulkOnboardFarmers(body, (req as any).user);
  }

  @Post('farmers/:farmerId/farms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a farm for a farmer onboarded by the agent',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: agentResponse.createFarmForFarmer,
  })
  async createFarmForFarmer(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Body() body: CreateFarmForFarmerDto,
    @Req() req: Request,
  ) {
    return this.service.createFarmForFarmer(farmerId, body, (req as any).user);
  }

  @Post('loan-applications/submit-for-farmer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Legacy: Submit a loan application on behalf of a farmer (backward compatibility)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: agentResponse.submitLoanForFarmer,
  })
  async submitLoanForFarmer(
    @Body() body: SubmitLoanForFarmerDto,
    @Req() req: Request,
  ) {
    return this.service.submitLoanForFarmer(body, (req as any).user);
  }

  @Post('farmers/:farmerId/loan-applications/marketplace')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Primary: Submit a farmer's loan application from marketplace-selected cart items",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    example: agentResponse.submitLoanForFarmerFromMarketplace,
  })
  async submitLoanForFarmerFromMarketplace(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Body() body: SubmitMarketplaceLoanForFarmerDto,
    @Req() req: Request,
  ) {
    return this.service.submitLoanForFarmerFromMarketplace(
      farmerId,
      body,
      (req as any).user,
    );
  }

  @Get('onboarded-farmers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get farmers onboarded by the logged-in agent' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.getOnboardedFarmers,
  })
  async getOnboardedFarmers(
    @Query() query: QueryOnboardedFarmersDto,
    @Req() req: Request,
  ) {
    return this.service.getOnboardedFarmers(query, (req as any).user);
  }

  @Get('onboarded-farmers/loan-applications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get loan applications for farmers onboarded by the logged-in agent',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.getOnboardedFarmersLoanApplications,
  })
  async getOnboardedFarmersLoanApplications(
    @Query() query: QueryOnboardedFarmersDto,
    @Req() req: Request,
  ) {
    return this.service.getOnboardedFarmersLoanApplications(
      query,
      (req as any).user,
    );
  }

  @Post('farmers/:farmerId/kyc-tier2')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Tier 2 KYC for an onboarded farmer' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.verifyFarmerTier2Kyc,
  })
  async verifyFarmerTier2Kyc(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Body() body: KycTier2Dto,
    @Req() req: Request,
  ) {
    return this.service.verifyFarmerTier2Kyc(farmerId, body, (req as any).user);
  }

  @Post('farmers/:farmerId/kyc-tier3')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Tier 3 KYC for an onboarded farmer' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.verifyFarmerTier3Kyc,
  })
  async verifyFarmerTier3Kyc(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Body() body: KycTier3Dto,
    @Req() req: Request,
  ) {
    return this.service.verifyFarmerTier3Kyc(farmerId, body, (req as any).user);
  }

  @Get('farmers/:farmerId/loan-cart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get an onboarded farmer's loan cart" })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.getFarmerCart,
  })
  async getFarmerCart(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Req() req: Request,
  ) {
    return this.service.getFarmerCart(farmerId, (req as any).user);
  }

  @Post('farmers/:farmerId/loan-cart/items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Add item to an onboarded farmer's loan cart" })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.addFarmerCartItem,
  })
  async addFarmerCartItem(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Body() body: AddCartItemDto,
    @Req() req: Request,
  ) {
    return this.service.addFarmerCartItem(farmerId, body, (req as any).user);
  }

  @Patch('farmers/:farmerId/loan-cart/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update item quantity in an onboarded farmer's loan cart" })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.updateFarmerCartItem,
  })
  async updateFarmerCartItem(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: UpdateCartItemDto,
    @Req() req: Request,
  ) {
    return this.service.updateFarmerCartItem(
      farmerId,
      itemId,
      body,
      (req as any).user,
    );
  }

  @Delete('farmers/:farmerId/loan-cart/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove item from an onboarded farmer's loan cart" })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.removeFarmerCartItem,
  })
  async removeFarmerCartItem(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Req() req: Request,
  ) {
    return this.service.removeFarmerCartItem(
      farmerId,
      itemId,
      (req as any).user,
    );
  }

  @Delete('farmers/:farmerId/loan-cart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Clear an onboarded farmer's loan cart" })
  @ApiResponse({
    status: HttpStatus.OK,
    example: agentResponse.clearFarmerCart,
  })
  async clearFarmerCart(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
    @Req() req: Request,
  ) {
    return this.service.clearFarmerCart(farmerId, (req as any).user);
  }
}
