import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { isNormalizedPhone, normalizePhone } from "../../common/utils/normalize-phone";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { ClientResponse, toClientResponse } from "./clients.types";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForOwner(userId: string): Promise<ClientResponse[]> {
    const rows = await this.prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toClientResponse);
  }

  async createForOwner(userId: string, dto: CreateClientDto): Promise<ClientResponse> {
    const phone = normalizePhone(dto.phone);
    if (!isNormalizedPhone(phone)) {
      throw new BadRequestException("Invalid phone format");
    }
    try {
      const row = await this.prisma.client.create({
        data: {
          userId,
          name: dto.name.trim(),
          phone,
        },
      });
      return toClientResponse(row);
    } catch (e) {
      this.rethrowUniquePhone(e);
      throw e;
    }
  }

  async updateForOwner(
    userId: string,
    id: string,
    dto: UpdateClientDto,
  ): Promise<ClientResponse> {
    if (dto.name === undefined && dto.phone === undefined) {
      throw new BadRequestException("No fields to update");
    }

    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException();
    }

    let phone: string | undefined;
    if (dto.phone !== undefined) {
      phone = normalizePhone(dto.phone);
      if (!isNormalizedPhone(phone)) {
        throw new BadRequestException("Invalid phone format");
      }
    }

    const data: Prisma.ClientUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (phone !== undefined) {
      data.phone = phone;
    }

    try {
      const row = await this.prisma.client.update({
        where: { id },
        data,
      });
      return toClientResponse(row);
    } catch (e) {
      this.rethrowUniquePhone(e);
      throw e;
    }
  }

  async deleteForOwner(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.prisma.client.delete({ where: { id } });
  }

  private rethrowUniquePhone(e: unknown): void {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new ConflictException("Phone already in use");
    }
  }
}
