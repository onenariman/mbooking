import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryResponse, toCategoryResponse } from "./categories.types";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForOwner(userId: string): Promise<CategoryResponse[]> {
    const rows = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toCategoryResponse);
  }

  async createForOwner(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    const categoryName = dto.category_name.trim();
    if (!categoryName) {
      throw new BadRequestException("Category name is required");
    }

    try {
      const row = await this.prisma.category.create({
        data: {
          userId,
          categoryName,
        },
      });
      return toCategoryResponse(row);
    } catch (e) {
      this.rethrowUniqueName(e);
      throw e;
    }
  }

  async updateForOwner(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    if (dto.category_name === undefined) {
      throw new BadRequestException("No fields to update");
    }

    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException();
    }

    const categoryName = dto.category_name.trim();
    if (!categoryName) {
      throw new BadRequestException("Category name is required");
    }

    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: { categoryName },
      });
      return toCategoryResponse(row);
    } catch (e) {
      this.rethrowUniqueName(e);
      throw e;
    }
  }

  async deleteForOwner(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException();
    }

    await this.prisma.category.delete({ where: { id } });
  }

  private rethrowUniqueName(e: unknown): void {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new ConflictException("Category name already in use");
    }
  }
}
