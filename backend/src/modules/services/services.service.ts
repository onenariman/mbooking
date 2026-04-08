import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServiceResponse, toServiceResponse } from "./services.types";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForOwner(userId: string): Promise<ServiceResponse[]> {
    const rows = await this.prisma.service.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toServiceResponse);
  }

  async createForOwner(
    userId: string,
    dto: CreateServiceDto,
  ): Promise<ServiceResponse> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException("Service name is required");
    }

    const categoryId = this.normalizeCategoryId(dto.category_id);
    await this.ensureCategoryOwnership(userId, categoryId);
    const price = this.normalizePrice(dto.price);

    const row = await this.prisma.service.create({
      data: {
        userId,
        name,
        categoryId,
        price,
      },
    });

    return toServiceResponse(row);
  }

  async updateForOwner(
    userId: string,
    id: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponse> {
    if (
      dto.name === undefined &&
      dto.category_id === undefined &&
      dto.price === undefined
    ) {
      throw new BadRequestException("No fields to update");
    }

    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException();
    }

    const data: Prisma.ServiceUpdateInput = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException("Service name is required");
      }
      data.name = name;
    }

    if (dto.category_id !== undefined) {
      const categoryId = this.normalizeCategoryId(dto.category_id);
      await this.ensureCategoryOwnership(userId, categoryId);
      data.categoryId = categoryId;
    }

    if (dto.price !== undefined) {
      data.price = this.normalizePrice(dto.price);
    }

    const row = await this.prisma.service.update({
      where: { id },
      data,
    });

    return toServiceResponse(row);
  }

  async deleteForOwner(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.prisma.service.delete({ where: { id } });
  }

  private normalizeCategoryId(value: string | null): string | null {
    if (value === null) {
      return null;
    }
    return value;
  }

  private normalizePrice(value: number | null): Prisma.Decimal | null {
    if (value === null) {
      return null;
    }
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException("Invalid price");
    }
    return new Prisma.Decimal(value);
  }

  private async ensureCategoryOwnership(
    userId: string,
    categoryId: string | null,
  ): Promise<void> {
    if (categoryId === null) {
      return;
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException("Category not found");
    }
    if (category.userId !== userId) {
      throw new ForbiddenException();
    }
  }
}
