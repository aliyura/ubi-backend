import { Controller, Get, HttpStatus, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { USER_ROLE } from '@prisma/client';
import { format } from 'date-fns';
import { Request, Response } from 'express';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/roles.decorator';
import { StatementQueryDto } from './dto/statement-query.dto';
import { StatementService } from './statement.service';

@ApiTags('Statement')
@Controller('v1/statement')
@UseGuards(RolesGuard)
@Roles(USER_ROLE.FARMER, USER_ROLE.AGENT)
export class StatementController {
  constructor(private readonly statementService: StatementService) {}

  @Get('csv')
  @ApiOperation({ summary: 'Download account statement as CSV (farmer & agent)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'CSV file download' })
  async downloadCsv(
    @Query() query: StatementQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req['user'];
    const buffer = await this.statementService.generateCsv(query, user);
    const filename = `statement-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.status(HttpStatus.OK).send(buffer);
  }

  @Get('pdf')
  @ApiOperation({ summary: 'Download account statement as PDF (farmer & agent)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'PDF file download' })
  async downloadPdf(
    @Query() query: StatementQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req['user'];
    const buffer = await this.statementService.generatePdf(query, user);
    const filename = `statement-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.status(HttpStatus.OK).send(buffer);
  }
}
