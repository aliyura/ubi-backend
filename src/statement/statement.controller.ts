import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
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
@Roles(USER_ROLE.FARMER, USER_ROLE.AGENT, USER_ROLE.USER)
export class StatementController {
  constructor(private readonly statementService: StatementService) {}

  @Get('csv')
  @ApiOperation({
    summary: 'Download or email account statement as CSV (farmer & agent)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV file download, or JSON confirmation when email=true',
  })
  async downloadCsv(
    @Query() query: StatementQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req['user'];
    const buffer = await this.statementService.generateCsv(query, user);
    const filename = `statement-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    if (query.email) {
      await this.statementService.sendStatementEmail(
        buffer,
        filename,
        'text/csv',
        user,
      );
      return res.status(HttpStatus.OK).json({
        status: true,
        message: 'Statement has been sent to your email address',
        statusCode: HttpStatus.OK,
      });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.status(HttpStatus.OK).send(buffer);
  }

  @Get('pdf')
  @ApiOperation({
    summary: 'Download or email account statement as PDF (farmer & agent)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF file download, or JSON confirmation when email=true',
  })
  async downloadPdf(
    @Query() query: StatementQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req['user'];
    const buffer = await this.statementService.generatePdf(query, user);
    const filename = `statement-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

    if (query.email) {
      await this.statementService.sendStatementEmail(
        buffer,
        filename,
        'application/pdf',
        user,
      );
      return res.status(HttpStatus.OK).json({
        status: true,
        message: 'Statement has been sent to your email address',
        statusCode: HttpStatus.OK,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.status(HttpStatus.OK).send(buffer);
  }
}
