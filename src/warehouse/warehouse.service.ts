import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async createWarehouse(body: CreateWarehouseDto) {
    const warehouse = await this.prisma.warehouse.create({
      data: body,
    });
    return {
      status: true,
      message: 'Warehouse created successfully',
      data: warehouse,
    };
  }

  async getAllWarehouses(activeOnly?: boolean) {
    const where = activeOnly ? { isActive: true } : {};
    const warehouses = await this.prisma.warehouse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { status: true, message: 'Warehouses retrieved', data: warehouses };
  }

  async getWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return { status: true, message: 'Warehouse retrieved', data: warehouse };
  }

  async updateWarehouse(id: string, body: UpdateWarehouseDto) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: body,
    });
    return {
      status: true,
      message: 'Warehouse updated successfully',
      data: updated,
    };
  }

  async deleteWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    await this.prisma.warehouse.delete({ where: { id } });
    return { status: true, message: 'Warehouse deleted successfully' };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  async getClosestWarehouses(farmId: string, limit: number = 5) {
    // Get farm with location data
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    if (!farm) throw new NotFoundException('Farm not found');
    if (!farm.latitude || !farm.longitude) {
      throw new ConflictException('Farm location coordinates not available');
    }

    // Get all active warehouses
    const warehouses = await this.prisma.warehouse.findMany({
      where: { isActive: true },
    });

    if (warehouses.length === 0) {
      return {
        status: true,
        message: 'No active warehouses available',
        data: {
          farm: {
            id: farm.id,
            name: farm.name,
            latitude: farm.latitude,
            longitude: farm.longitude,
          },
          warehouses: [],
        },
      };
    }

    // Calculate distances and sort
    const warehousesWithDistance = warehouses
      .map((warehouse) => ({
        id: warehouse.id,
        name: warehouse.name,
        address: warehouse.address,
        state: warehouse.state,
        lga: warehouse.lga,
        latitude: warehouse.latitude,
        longitude: warehouse.longitude,
        distance: this.calculateDistance(
          farm.latitude,
          farm.longitude,
          warehouse.latitude,
          warehouse.longitude,
        ),
        distanceUnit: 'km',
        contactPerson: warehouse.contactPerson,
        contactPhone: warehouse.contactPhone,
        contactEmail: warehouse.contactEmail,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return {
      status: true,
      message: 'Closest warehouses retrieved',
      data: {
        farm: {
          id: farm.id,
          name: farm.name,
          latitude: farm.latitude,
          longitude: farm.longitude,
        },
        warehouses: warehousesWithDistance,
      },
    };
  }
}
