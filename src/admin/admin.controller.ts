import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeController,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AddPlanDto } from './dto/AddDataPlanDto';
import { AdminService } from './admin.service';
import { AddCablPlanDto } from './dto/AddCablPlanDto';
import { InviteAgentDto } from './dto/InviteAgentDto';
import { adminResponse } from './admin.response';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { Request } from 'express';

@Controller('/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin profile' })
  @ApiResponse({ status: HttpStatus.OK, example: adminResponse.adminProfile })
  async getProfile(@Req() req: Request) {
    return this.adminService.getProfile((req as any).user);
  }

  @Get('system-settings')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system settings: daily transfer limits and fees' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminResponse.systemSettings,
  })
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Post('agents/invite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite an agent by email (super admin only)' })
  @ApiResponse({ status: HttpStatus.OK, example: adminResponse.inviteAgent })
  async inviteAgent(@Body() body: InviteAgentDto, @Req() req: Request) {
    return this.adminService.inviteAgent(body, (req as any).user);
  }

  @ApiExcludeEndpoint()
  @Post('data/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add data plan' })
  @ApiResponse({ status: HttpStatus.OK, example: adminResponse.addDataPlan })
  async addDataPlan(@Body() body: AddPlanDto) {
    return this.adminService.addDataPlan(body);
  }

  @ApiExcludeEndpoint()
  @Post('airtime/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add airtime plan' })
  @ApiResponse({ status: HttpStatus.OK, example: adminResponse.addAirtimePlan })
  async addAirtimePlan(@Body() body: AddPlanDto) {
    return this.adminService.addAirtimePlan(body);
  }

  @ApiExcludeEndpoint()
  @Post('cable/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add cable plan' })
  @ApiResponse({ status: HttpStatus.OK, example: adminResponse.addCablePlan })
  async addCablePlan(@Body() body: AddCablPlanDto) {
    return this.adminService.addCablePlan(body);
  }

  @ApiExcludeEndpoint()
  @Post('electricity/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add electricity plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminResponse.addElectricityPlan,
  })
  async addElectricityPlan(@Body() body: AddCablPlanDto) {
    return this.adminService.addElectricityPlan(body);
  }

  @ApiExcludeEndpoint()
  @Post('internet/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add internet service plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminResponse.addInternetServicePlan,
  })
  async addInternetServicePlan(@Body() body: AddCablPlanDto) {
    return this.adminService.addInternetServicePlan(body);
  }

  @ApiExcludeEndpoint()
  @Post('transport/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add transport plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminResponse.addTransportPlan,
  })
  async addTransportPlan(@Body() body: AddCablPlanDto) {
    return this.adminService.addTransportPlan(body);
  }

  @ApiExcludeEndpoint()
  @Post('schoolfee/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add school fee plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    example: adminResponse.addSchoolFeePlan,
  })
  async addSchoolFeePlan(@Body() body: AddCablPlanDto) {
    return this.adminService.addSchoolFeePlan(body);
  }

  @ApiExcludeEndpoint()
  @Delete('delete-plan/:id/:bill_type')
  @ApiOperation({ summary: 'Delete a bill plan' })
  @ApiResponse({ status: HttpStatus.OK, example: adminResponse.deletePlan })
  async deletePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('bill_type') bill_type: string,
  ) {
    return this.adminService.deletePlan(id, bill_type.toLowerCase());
  }
}
