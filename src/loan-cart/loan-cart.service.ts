import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto';
import { User } from '@prisma/client';
import { Helpers } from 'src/helpers';

@Injectable()
export class LoanCartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { resource: { include: { category: true } } } } },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: { include: { resource: { include: { category: true } } } } },
      });
    }
    return cart;
  }

  private computeTotals(items: any[]) {
    return Helpers.round2(
      items.reduce(
        (acc, item) => acc + Helpers.round2(item.resource.unitPrice * item.quantity),
        0,
      ),
    );
  }

  async getCart(user: User) {
    const cart = await this.getOrCreateCart(user.id);
    const total = this.computeTotals(cart.items);
    return {
      status: true,
      message: 'Cart retrieved',
      data: { ...cart, total },
    };
  }

  async addItem(body: AddCartItemDto, user: User) {
    const resource = await this.prisma.loanResource.findFirst({
      where: { id: body.resourceId, isActive: true, isEligibleForLoan: true },
    });
    if (!resource) throw new NotFoundException('Resource not found or not eligible for loan');
    if (body.quantity > resource.stockQuantity) {
      throw new BadRequestException(
        `Requested quantity exceeds available stock (${resource.stockQuantity} ${resource.unitOfMeasure})`,
      );
    }

    const cart = await this.getOrCreateCart(user.id);

    const existing = cart.items.find((i) => i.resourceId === body.resourceId);
    if (existing) {
      const newQty = body.quantity;
      if (newQty > resource.stockQuantity) {
        throw new BadRequestException('Quantity exceeds available stock');
      }
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, resourceId: body.resourceId, quantity: body.quantity },
      });
    }

    return this.getCart(user);
  }

  async updateItem(itemId: string, body: UpdateCartItemDto, user: User) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, resource: true },
    });
    if (!item || item.cart.userId !== user.id) {
      throw new NotFoundException('Cart item not found');
    }
    if (body.quantity > item.resource.stockQuantity) {
      throw new BadRequestException('Quantity exceeds available stock');
    }
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: body.quantity },
    });
    return this.getCart(user);
  }

  async removeItem(itemId: string, user: User) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== user.id) {
      throw new NotFoundException('Cart item not found');
    }
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(user);
  }

  async clearCart(user: User) {
    const cart = await this.prisma.cart.findUnique({ where: { userId: user.id } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { status: true, message: 'Cart cleared', data: null };
  }

  async getCartForUser(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { resource: true } } },
    });
  }
}
