import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ClientPortalRoleGuard } from "../../common/guards/client-portal-role.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OwnerRoleGuard } from "../../common/guards/owner-role.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { PushSendService } from "../push/push-send.service";
import { SubscribePushDto } from "../push/dto/subscribe-push.dto";
import { UnsubscribePushDto } from "../push/dto/unsubscribe-push.dto";
import { ActivateClientInvitationDto } from "./dto/activate-client-invitation.dto";
import { ClientSettingsDto } from "./dto/client-settings.dto";
import { CreateClientInvitationDto } from "./dto/create-client-invitation.dto";
import { ClientPortalContextService } from "./client-portal-context.service";
import { ClientPortalInvitationsService } from "./client-portal-invitations.service";

@Controller("client")
@UseGuards(JwtAuthGuard)
export class ClientPortalController {
  constructor(
    private readonly invitations: ClientPortalInvitationsService,
    private readonly contextService: ClientPortalContextService,
    private readonly prisma: PrismaService,
    private readonly pushSend: PushSendService,
  ) {}

  @UseGuards(OwnerRoleGuard)
  @Post("invitations")
  async createInvitation(
    @CurrentUser("sub") ownerUserId: string,
    @Body() dto: CreateClientInvitationDto,
  ) {
    const data = await this.invitations.createInvite(ownerUserId, dto);
    return { data };
  }

  @Public()
  @Get("invitations/:token/validate")
  async validateInvitation(@Param("token") token: string) {
    const data = await this.invitations.validateInvite(token);
    return { data };
  }

  @Public()
  @Post("invitations/:token/activate")
  async activateInvitation(
    @Param("token") token: string,
    @Body() dto: ActivateClientInvitationDto,
  ) {
    const data = await this.invitations.activateInvite(token, dto);
    return { data };
  }

  @UseGuards(ClientPortalRoleGuard)
  @Post("push/subscribe")
  async subscribePush(
    @CurrentUser("sub") authUserId: string,
    @Body() dto: SubscribePushDto,
  ) {
    const context = await this.contextService.getContextOrThrow(authUserId);
    await this.contextService.touchSession(context);

    await this.prisma.pushSubscription.upsert({
      where: {
        authUserId_ownerUserId_endpoint: {
          authUserId,
          ownerUserId: context.ownerUserId,
          endpoint: dto.subscription.endpoint,
        },
      },
      create: {
        audience: "client_portal",
        authUserId,
        ownerUserId: context.ownerUserId,
        endpoint: dto.subscription.endpoint,
        p256dh: dto.subscription.keys.p256dh,
        auth: dto.subscription.keys.auth,
      },
      update: {
        p256dh: dto.subscription.keys.p256dh,
        auth: dto.subscription.keys.auth,
      },
    });

    return { data: true };
  }

  @UseGuards(ClientPortalRoleGuard)
  @Post("push/test")
  @HttpCode(HttpStatus.OK)
  async testPush(@CurrentUser("sub") authUserId: string) {
    const context = await this.contextService.getContextOrThrow(authUserId);
    await this.contextService.touchSession(context);

    const result = await this.pushSend.sendClientPortalPushNotification({
      ownerUserId: context.ownerUserId,
      clientAuthUserId: authUserId,
      payload: {
        title: "Тестовое уведомление",
        body: "Если вы видите это уведомление, push для клиента уже работает.",
        requireInteraction: true,
        tag: "client-portal-test-push",
        url: "/client",
      },
    });

    return { data: result };
  }

  @UseGuards(ClientPortalRoleGuard)
  @Delete("push/subscribe")
  @HttpCode(HttpStatus.OK)
  async unsubscribePush(
    @CurrentUser("sub") authUserId: string,
    @Body() dto: UnsubscribePushDto,
  ) {
    const context = await this.contextService.getContextOrThrow(authUserId);
    await this.contextService.touchSession(context);

    await this.prisma.pushSubscription.deleteMany({
      where: {
        authUserId,
        ownerUserId: context.ownerUserId,
        audience: "client_portal",
        endpoint: dto.endpoint,
      },
    });

    return { data: true };
  }

  @UseGuards(ClientPortalRoleGuard)
  @Get("me")
  async me(@CurrentUser("sub") authUserId: string) {
    const context = await this.contextService.getContextOrThrow(authUserId);
    await this.contextService.touchSession(context);
    const data = await this.contextService.me(context);
    return { data };
  }

  @UseGuards(ClientPortalRoleGuard)
  @Get("appointments")
  async appointments(@CurrentUser("sub") authUserId: string) {
    const context = await this.contextService.getContextOrThrow(authUserId);
    await this.contextService.touchSession(context);
    const data = await this.contextService.appointments(context);
    return { data };
  }

  @UseGuards(ClientPortalRoleGuard)
  @Get("discounts")
  async discounts(@CurrentUser("sub") authUserId: string) {
    const context = await this.contextService.getContextOrThrow(authUserId);
    await this.contextService.touchSession(context);
    const data = await this.contextService.discounts(context);
    return { data };
  }

  @UseGuards(ClientPortalRoleGuard)
  @Patch("settings")
  async patchSettings(
    @CurrentUser("sub") authUserId: string,
    @Body() dto: ClientSettingsDto,
  ) {
    if (dto.notifications_enabled === undefined) {
      throw new BadRequestException("Нет полей для обновления");
    }
    const data = await this.contextService.updateSettings(authUserId, dto);
    return { data };
  }
}
