import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFarmDto, UpdateFarmDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class FarmService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyFarms(user: User) {
    const farms = await this.prisma.farm.findMany({
      where: { userId: user.id },
      include: { photos: true },
      orderBy: { createdAt: 'desc' },
    });
    return { status: true, message: 'Farms retrieved', data: farms };
  }

  async getFarm(id: string, user: User) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: { photos: true },
    });
    if (!farm) throw new NotFoundException('Farm not found');
    if (farm.userId !== user.id) throw new ForbiddenException('Access denied');
    return { status: true, message: 'Farm retrieved', data: farm };
  }

  async createFarm(body: CreateFarmDto, user: User) {
    const farm = await this.prisma.farm.create({
      data: {
        ...body,
        userId: user.id,
        expectedPlantingDate: body.expectedPlantingDate
          ? new Date(body.expectedPlantingDate)
          : undefined,
        expectedHarvestDate: body.expectedHarvestDate
          ? new Date(body.expectedHarvestDate)
          : undefined,
      },
      include: { photos: true },
    });
    return { status: true, message: 'Farm created', data: farm };
  }

  async updateFarm(id: string, body: UpdateFarmDto, user: User) {
    const farm = await this.prisma.farm.findUnique({ where: { id } });
    if (!farm) throw new NotFoundException('Farm not found');
    if (farm.userId !== user.id) throw new ForbiddenException('Access denied');

    const updated = await this.prisma.farm.update({
      where: { id },
      data: {
        ...body,
        expectedPlantingDate: body.expectedPlantingDate
          ? new Date(body.expectedPlantingDate)
          : undefined,
        expectedHarvestDate: body.expectedHarvestDate
          ? new Date(body.expectedHarvestDate)
          : undefined,
      },
      include: { photos: true },
    });
    return { status: true, message: 'Farm updated', data: updated };
  }

  async addFarmPhoto(farmId: string, url: string, filename: string, user: User) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Farm not found');
    if (farm.userId !== user.id) throw new ForbiddenException('Access denied');

    const photo = await this.prisma.farmPhoto.create({
      data: { farmId, url, filename },
    });
    return { status: true, message: 'Photo added', data: photo };
  }

  async getFarmById(id: string) {
    return this.prisma.farm.findUnique({ where: { id }, include: { photos: true } });
  }
}
