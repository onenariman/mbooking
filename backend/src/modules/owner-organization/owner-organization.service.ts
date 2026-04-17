import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PatchOwnerOrganizationDto } from "./dto/patch-owner-organization.dto";

export type OwnerOrganizationView = {
  email: string;
  full_name: string | null;
  phone: string | null;
  inn: string | null;
};

@Injectable()
export class OwnerOrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getForOwner(ownerUserId: string): Promise<OwnerOrganizationView> {
    const user = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { email: true },
    });

    const org = await this.prisma.ownerOrganization.findUnique({
      where: { ownerUserId },
      select: { fullName: true, phone: true, inn: true },
    });

    return {
      email: user?.email ?? "",
      full_name: org?.fullName ?? null,
      phone: org?.phone ?? null,
      inn: org?.inn ?? null,
    };
  }

  async patchForOwner(ownerUserId: string, dto: PatchOwnerOrganizationDto) {
    const { full_name, phone, inn } = dto;

    const data = {
      ...(full_name !== undefined ? { fullName: full_name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(inn !== undefined ? { inn } : {}),
    };

    const hasAny = Object.keys(data).length > 0;
    if (!hasAny) {
      return this.getForOwner(ownerUserId);
    }

    await this.prisma.ownerOrganization.upsert({
      where: { ownerUserId },
      update: data,
      create: {
        ownerUserId,
        fullName: full_name ?? null,
        phone: phone ?? null,
        inn: inn ?? null,
      },
    });

    return this.getForOwner(ownerUserId);
  }
}

