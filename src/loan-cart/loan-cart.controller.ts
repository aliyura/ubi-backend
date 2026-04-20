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
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { LoanCartService } from './loan-cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto';
import { loanCartResponse } from './loan-cart.response';

@ApiTags('Loan Cart')
@Controller('v1/loan-cart')
export class LoanCartController {
  constructor(private readonly service: LoanCartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current cart' })
  @ApiResponse({ status: HttpStatus.OK, example: loanCartResponse.getCart })
  async getCart(@Req() req: Request) {
    return this.service.getCart((req as any).user);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: HttpStatus.OK, example: loanCartResponse.addItem })
  async addItem(@Body() body: AddCartItemDto, @Req() req: Request) {
    return this.service.addItem(body, (req as any).user);
  }

  @Patch('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: HttpStatus.OK, example: loanCartResponse.updateItem })
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCartItemDto,
    @Req() req: Request,
  ) {
    return this.service.updateItem(id, body, (req as any).user);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: HttpStatus.OK, example: loanCartResponse.removeItem })
  async removeItem(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.service.removeItem(id, (req as any).user);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: HttpStatus.OK, example: loanCartResponse.clearCart })
  async clearCart(@Req() req: Request) {
    return this.service.clearCart((req as any).user);
  }
}
