import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AddPlanDto } from './dto/AddDataPlanDto';
import { AdminService } from './admin.service';
import { AddCablPlanDto } from './dto/AddCablPlanDto';
import { adminResponse } from './admin.response';

@Controller('/v1/admin')
// @Roles(USER_ROLE.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
