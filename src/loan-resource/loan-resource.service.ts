import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MARKETPLACE_ORDER_STATUS, FULFILLMENT_STATUS } from '@prisma/client';
import {
  CreateLoanResourceDto,
  CreateResourceCategoryDto,
  QueryLoanResourceDto,
  ResourceInventoryQueryDto,
  UpdateLoanResourceDto,
  UpdateResourceCategoryDto,
} from './dto';

@Injectable()
export class LoanResourceService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    const categories = await this.prisma.loanResourceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { status: true, message: 'Categories retrieved', data: categories };
  }

  async createCategory(body: CreateResourceCategoryDto) {
    const exists = await this.prisma.loanResourceCategory.findUnique({
      where: { name: body.name },
    });
    if (exists) throw new ConflictException('Category name already exists');

    const category = await this.prisma.loanResourceCategory.create({
      data: body,
    });
    return { status: true, message: 'Category created', data: category };
  }

  async adminGetCategories() {
    const categories = await this.prisma.loanResourceCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return { status: true, message: 'Categories retrieved', data: categories };
  }

  async updateCategory(id: string, body: UpdateResourceCategoryDto) {
    const category = await this.prisma.loanResourceCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category not found');

    if (body.name && body.name !== category.name) {
      const exists = await this.prisma.loanResourceCategory.findUnique({
        where: { name: body.name },
      });
      if (exists) throw new ConflictException('Category name already exists');
    }

    const updated = await this.prisma.loanResourceCategory.update({
      where: { id },
      data: body,
    });
    return { status: true, message: 'Category updated', data: updated };
  }

  async deactivateCategory(id: string) {
    const category = await this.prisma.loanResourceCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category not found');

    await this.prisma.loanResourceCategory.update({
      where: { id },
      data: { isActive: false },
    });
    return { status: true, message: 'Category deactivated' };
  }

  async adminGetResources(query: QueryLoanResourceDto) {
    const { categoryId, search, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.loanResource.findMany({
        where,
        include: { category: true },
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      this.prisma.loanResource.count({ where }),
    ]);

    return {
      status: true,
      message: 'Resources retrieved',
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getResources(query: QueryLoanResourceDto) {
    const { categoryId, search, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.loanResource.findMany({
        where,
        include: { category: true },
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      this.prisma.loanResource.count({ where }),
    ]);

    return {
      status: true,
      message: 'Resources retrieved',
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getResource(id: string) {
    const resource = await this.prisma.loanResource.findFirst({
      where: { id, isActive: true },
      include: { category: true },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    return { status: true, message: 'Resource retrieved', data: resource };
  }

  async createResource(body: CreateLoanResourceDto) {
    const category = await this.prisma.loanResourceCategory.findUnique({
      where: { id: body.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const resource = await this.prisma.loanResource.create({ data: body });
    return { status: true, message: 'Resource created', data: resource };
  }

  async updateResource(id: string, body: UpdateLoanResourceDto) {
    const resource = await this.prisma.loanResource.findUnique({
      where: { id },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    const updated = await this.prisma.loanResource.update({
      where: { id },
      data: body,
    });
    return { status: true, message: 'Resource updated', data: updated };
  }

  async getResourceInventory(id: string, query: ResourceInventoryQueryDto) {
    const resource = await this.prisma.loanResource.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        unitOfMeasure: true,
        stockQuantity: true,
        category: { select: { id: true, name: true } },
      },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    const dateFilter = this.buildDateFilter(query);
    const stats = await this.aggregateInventoryStats(id, dateFilter);

    return {
      status: true,
      message: 'Resource inventory retrieved',
      data: {
        resource,
        dateRange: { from: query.from ?? null, to: query.to ?? null },
        stockBalance: resource.stockQuantity,
        ...stats,
      },
    };
  }

  async getInventorySummary(query: ResourceInventoryQueryDto) {
    const resources = await this.prisma.loanResource.findMany({
      select: {
        id: true,
        name: true,
        unitOfMeasure: true,
        stockQuantity: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const dateFilter = this.buildDateFilter(query);

    const SOLD_STATUSES = [
      MARKETPLACE_ORDER_STATUS.confirmed,
      MARKETPLACE_ORDER_STATUS.packed,
      MARKETPLACE_ORDER_STATUS.dispatched,
      MARKETPLACE_ORDER_STATUS.delivered,
    ];

    const [soldRows, distApprovedRows, distFallbackRows] = await Promise.all([
      this.prisma.marketplaceOrderItem.groupBy({
        by: ['resourceId'],
        _sum: { quantity: true },
        where: {
          order: { status: { in: SOLD_STATUSES }, createdAt: dateFilter },
        },
      }),
      this.prisma.loanApplicationItem.groupBy({
        by: ['resourceId'],
        _sum: { approvedQuantity: true },
        where: {
          approvedQuantity: { not: null },
          application: {
            fulfillment: {
              status: FULFILLMENT_STATUS.delivered,
              deliveredAt: dateFilter,
            },
          },
        },
      }),
      this.prisma.loanApplicationItem.groupBy({
        by: ['resourceId'],
        _sum: { quantity: true },
        where: {
          approvedQuantity: null,
          application: {
            fulfillment: {
              status: FULFILLMENT_STATUS.delivered,
              deliveredAt: dateFilter,
            },
          },
        },
      }),
    ]);

    const soldMap = new Map(soldRows.map((r) => [r.resourceId, r._sum.quantity ?? 0]));
    const distApprovedMap = new Map(distApprovedRows.map((r) => [r.resourceId, r._sum.approvedQuantity ?? 0]));
    const distFallbackMap = new Map(distFallbackRows.map((r) => [r.resourceId, r._sum.quantity ?? 0]));

    const data = resources.map((r) => ({
      resource: { id: r.id, name: r.name, unitOfMeasure: r.unitOfMeasure, category: r.category },
      stockBalance: r.stockQuantity,
      unitsSold: soldMap.get(r.id) ?? 0,
      unitsDistributed: (distApprovedMap.get(r.id) ?? 0) + (distFallbackMap.get(r.id) ?? 0),
    }));

    return {
      status: true,
      message: 'Inventory summary retrieved',
      data,
      dateRange: { from: query.from ?? null, to: query.to ?? null },
    };
  }

  private buildDateFilter(query: ResourceInventoryQueryDto) {
    const filter: { gte?: Date; lte?: Date } = {};
    if (query.from) filter.gte = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      filter.lte = to;
    }
    return Object.keys(filter).length ? filter : undefined;
  }

  private async aggregateInventoryStats(
    resourceId: string,
    dateFilter: { gte?: Date; lte?: Date } | undefined,
  ) {
    const SOLD_STATUSES = [
      MARKETPLACE_ORDER_STATUS.confirmed,
      MARKETPLACE_ORDER_STATUS.packed,
      MARKETPLACE_ORDER_STATUS.dispatched,
      MARKETPLACE_ORDER_STATUS.delivered,
    ];

    const deliveredFilter = {
      status: FULFILLMENT_STATUS.delivered,
      ...(dateFilter ? { deliveredAt: dateFilter } : {}),
    };

    const [soldResult, distApproved, distFallback] = await Promise.all([
      this.prisma.marketplaceOrderItem.aggregate({
        _sum: { quantity: true },
        where: {
          resourceId,
          order: {
            status: { in: SOLD_STATUSES },
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
      }),
      this.prisma.loanApplicationItem.aggregate({
        _sum: { approvedQuantity: true },
        where: {
          resourceId,
          approvedQuantity: { not: null },
          application: { fulfillment: deliveredFilter },
        },
      }),
      this.prisma.loanApplicationItem.aggregate({
        _sum: { quantity: true },
        where: {
          resourceId,
          approvedQuantity: null,
          application: { fulfillment: deliveredFilter },
        },
      }),
    ]);

    return {
      unitsSold: soldResult._sum.quantity ?? 0,
      unitsDistributed:
        (distApproved._sum.approvedQuantity ?? 0) +
        (distFallback._sum.quantity ?? 0),
    };
  }
}
