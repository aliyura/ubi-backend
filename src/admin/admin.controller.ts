import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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

  @Post('agents/invite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite an agent by email (super admin only)' })
  @ApiResponse({ status: HttpStatus.OK })
  async inviteAgent(@Body() body: InviteAgentDto, @Req() req: Request) {
    return this.adminService.inviteAgent(body, (req as any).user);
  }

  @Post('data/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add data plan' })
  @ApiResponse({ status: HttpStatus.OK, example: adminResponse.addDataPlan })
  async addDataPlan(@Body() body: AddPlanDto) {
    return this.adminService.addDataPlan(body);
  }

  @Post('airtime/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add airtime plan' })
  @ApiResponse({ status: HttpStatus.OK, example: adminResponse.addAirtimePlan })
  async addAirtimePlan(@Body() body: AddPlanDto) {
    return this.adminService.addAirtimePlan(body);
  }

  @Post('cable/add-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add cable plan' })
  @ApiResponse({ status: HttpStatus.OK, example: adminResponse.addCablePlan })
  async addCablePlan(@Body() body: AddCablPlanDto) {
    return this.adminService.addCablePlan(body);
  }

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
