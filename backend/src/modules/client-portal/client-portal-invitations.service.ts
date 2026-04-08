import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import {
  formatPhoneDisplay,
  isNormalizedPhone,
  normalizePhone,
} from "../../common/utils/normalize-phone";
import { createHash, randomBytes } from "node:crypto";
import * as bcrypt from "bcrypt";
import { ActivateClientInvitationDto } from "./dto/activate-client-invitation.dto";
import { CreateClientInvitationDto } from "./dto/create-client-invitation.dto";

const INVITE_MIN_TOKEN_LENGTH = 16;

@Injectable()
export class ClientPortalInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createInvite(ownerUserId: string, dto: CreateClientInvitationDto) {
    const normalizedPhone = normalizePhone(dto.client_phone);
    if (!isNormalizedPhone(normalizedPhone)) {
      throw new BadRequestException("Телефон клиента некорректный");
    }

    if (dto.client_user_id && dto.client_user_id !== ownerUserId) {
      throw new ForbiddenException(
        "Этот клиент принадлежит другому аккаунту. Войдите в админку под тем же пользователем, под которым открыт список клиентов.",
      );
    }

    const client = await this.getInviteClient({
      ownerUserId,
      clientId: dto.client_id,
      clientPhone: normalizedPhone,
    });

    if (!client && dto.client_id) {
      const foreignClient = await this.prisma.client.findUnique({
        where: { id: dto.client_id },
      });
      if (foreignClient) {
        throw new ForbiddenException(
          "Этот клиент найден, но не принадлежит текущей сессии. Скорее всего, сейчас открыт клиентский кабинет или другой аккаунт.",
        );
      }
    }

    const clientPhone = normalizePhone(client?.phone ?? normalizedPhone);
    if (!isNormalizedPhone(clientPhone)) {
      throw new BadRequestException("У клиента сохранен некорректный номер телефона");
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresInHours = dto.expires_in_hours ?? 24 * 7;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const purpose = dto.purpose ?? "activation";

    await this.prisma.clientPortalInvite.create({
      data: {
        ownerUserId,
        createdBy: ownerUserId,
        clientPhone,
        tokenHash,
        purpose,
        expiresAt,
      },
    });

    const baseUrl = this.config
      .getOrThrow<string>("app.publicBaseUrl")
      .replace(/\/$/, "");

    return {
      invitation_link: `${baseUrl}/client/invite/${token}`,
      client_phone: clientPhone,
      client_phone_display: formatPhoneDisplay(clientPhone),
      client_name: client?.name ?? null,
      purpose,
      expires_at: expiresAt.toISOString(),
    };
  }

  async validateInvite(token: string) {
    const invite = await this.getValidInvite(token);
    const client = await this.getInviteClient({
      ownerUserId: invite.ownerUserId,
      clientPhone: invite.clientPhone,
    });
    return {
      client_phone: invite.clientPhone,
      client_phone_display: formatPhoneDisplay(invite.clientPhone),
      client_name: client?.name ?? null,
      purpose: invite.purpose,
      expires_at: invite.expiresAt.toISOString(),
    };
  }

  async activateInvite(token: string, dto: ActivateClientInvitationDto) {
    if (dto.password !== dto.confirm_password) {
      throw new BadRequestException("Пароли не совпадают");
    }

    const invite = await this.getValidInvite(token);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const existingProfile = await tx.clientPortalProfile.findUnique({
        where: { phone: invite.clientPhone },
      });

      const passwordHash = await bcrypt.hash(dto.password, 10);
      let authUserId = existingProfile?.authUserId ?? null;

      if (authUserId) {
        try {
          await tx.user.update({
            where: { id: authUserId },
            data: {
              email: dto.email.toLowerCase(),
              passwordHash,
              role: "client_portal",
              isActive: true,
            },
          });
        } catch (e) {
          throw new ConflictException("Email уже используется");
        }
      } else {
        const existingUserByEmail = await tx.user.findUnique({
          where: { email: dto.email.toLowerCase() },
        });
        if (existingUserByEmail && existingUserByEmail.role !== "client_portal") {
          throw new ConflictException("Email уже используется");
        }
        if (existingUserByEmail) {
          authUserId = existingUserByEmail.id;
          await tx.user.update({
            where: { id: authUserId },
            data: { passwordHash, isActive: true, role: "client_portal" },
          });
        } else {
          const created = await tx.user.create({
            data: {
              email: dto.email.toLowerCase(),
              passwordHash,
              role: "client_portal",
              isActive: true,
            },
          });
          authUserId = created.id;
        }
      }

      const client = await this.getInviteClientTx(tx, {
        ownerUserId: invite.ownerUserId,
        clientPhone: invite.clientPhone,
      });
      const displayName = existingProfile?.displayName ?? client?.name ?? null;

      await tx.clientPortalProfile.upsert({
        where: { authUserId },
        create: {
          authUserId,
          phone: invite.clientPhone,
          displayName,
          lastLoginAt: now,
        },
        update: {
          phone: invite.clientPhone,
          displayName,
          lastLoginAt: now,
        },
      });

      await tx.clientPortalLink.upsert({
        where: {
          ownerUserId_clientPhone: {
            ownerUserId: invite.ownerUserId,
            clientPhone: invite.clientPhone,
          },
        },
        create: {
          ownerUserId: invite.ownerUserId,
          clientAuthUserId: authUserId,
          clientId: client?.id ?? null,
          clientPhone: invite.clientPhone,
          isActive: true,
          lastSeenAt: now,
        },
        update: {
          clientAuthUserId: authUserId,
          clientId: client?.id ?? null,
          isActive: true,
          lastSeenAt: now,
        },
      });

      await tx.clientPortalInvite.update({
        where: { id: invite.id },
        data: { usedAt: now },
      });

      return {
        client_phone: invite.clientPhone,
        client_phone_display: formatPhoneDisplay(invite.clientPhone),
        client_name: displayName,
        owner_user_id: invite.ownerUserId,
        purpose: invite.purpose,
      };
    });

    return result;
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async getValidInvite(token: string) {
    if (!token || token.length < INVITE_MIN_TOKEN_LENGTH) {
      throw new NotFoundException("Приглашение недействительно");
    }
    const tokenHash = this.hashToken(token);
    const invite = await this.prisma.clientPortalInvite.findUnique({
      where: { tokenHash },
    });
    if (!invite) {
      throw new NotFoundException("Приглашение не найдено");
    }
    if (invite.usedAt) {
      throw new BadRequestException("Приглашение уже использовано");
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException("Срок действия приглашения истек");
    }
    return invite;
  }

  private async getInviteClient(params: {
    ownerUserId: string;
    clientId?: string;
    clientPhone?: string;
  }) {
    return this.getInviteClientTx(this.prisma, params);
  }

  private async getInviteClientTx(
    tx: Pick<PrismaService, "client">,
    params: { ownerUserId: string; clientId?: string; clientPhone?: string },
  ) {
    if (!params.clientId && !params.clientPhone) {
      throw new BadRequestException("Не указан клиент для приглашения");
    }

    if (params.clientId) {
      const row = await tx.client.findFirst({
        where: { id: params.clientId, userId: params.ownerUserId },
      });
      if (row) {
        return row;
      }
    }

    if (params.clientPhone) {
      const phoneTail = params.clientPhone.slice(-10);
      const candidates = await tx.client.findMany({
        where: {
          userId: params.ownerUserId,
          phone: { endsWith: phoneTail },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      return (
        candidates.find((c) => normalizePhone(c.phone) === params.clientPhone) ??
        null
      );
    }

    return null;
  }
}
