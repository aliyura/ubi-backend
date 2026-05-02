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
import { AgentService } from './agent.service';
import { GetActivityLogsDto, SubmitVerificationDto } from './dto';
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
  @ApiOperation({ summary: 'Get applications assigned to me for field verification' })
  @ApiResponse({ status: HttpStatus.OK, example: agentResponse.getAssigned })
  async getAssigned(@Req() req: Request) {
    return this.service.getAssignedApplications((req as any).user);
  }

  @Post('loan-applications/:id/verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit field verification report' })
  @ApiResponse({ status: HttpStatus.OK, example: agentResponse.submitVerification })
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
  @ApiResponse({ status: HttpStatus.OK, example: agentResponse.getAssignedFarmers })
  async getAssignedFarmers(@Req() req: Request) {
    return this.service.getAssignedFarmers((req as any).user);
  }

  @Get('activity-logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get agent activity logs for a time range (admin must supply ?agentId=)' })
  @ApiResponse({ status: HttpStatus.OK, example: agentResponse.getActivityLogs })
  async getActivityLogs(
    @Query() query: GetActivityLogsDto,
    @Req() req: Request,
  ) {
    return this.service.getActivityLogs(query, (req as any).user);
  }
}
