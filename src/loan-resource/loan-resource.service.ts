import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateLoanResourceDto,
  CreateResourceCategoryDto,
  QueryLoanResourceDto,
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
}
