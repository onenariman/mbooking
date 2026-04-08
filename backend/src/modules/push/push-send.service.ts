import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import webpush from "web-push";
import { PrismaService } from "../../prisma/prisma.service";

export type PushNotificationPayload = {
  body: string;
  requireInteraction?: boolean;
  tag?: string;
  title: string;
  url?: string;
};

const OWNER_AUDIENCE = "owner";
const CLIENT_PORTAL_AUDIENCE = "client_portal";

function readWebPushErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  if (
    "statusCode" in error &&
    typeof (error as { statusCode?: number }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return null;
}

@Injectable()
export class PushSendService {
  private readonly logger = new Logger(PushSendService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  isConfigured(): boolean {
    const publicKey = this.getPublicKey();
    const privateKey = this.config.get<string>("app.vapid.privateKey") ?? "";
    const subject = this.config.get<string>("app.vapid.subject") ?? "";
    return Boolean(publicKey && privateKey && subject);
  }

  getPublicKey(): string {
    return this.config.get<string>("app.vapid.publicKey") ?? "";
  }

  private ensureWebPush(): typeof webpush {
    const publicKey = this.getPublicKey();
    const privateKey = this.config.get<string>("app.vapid.privateKey") ?? "";
    const subject = this.config.get<string>("app.vapid.subject") ?? "";
    if (!publicKey || !privateKey || !subject) {
      throw new Error("VAPID env vars are not configured");
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return webpush;
  }

  async sendOwnerPushNotification(params: {
    ownerUserId: string;
    payload: PushNotificationPayload;
  }): Promise<{ failed: number; sent: number; skipped: boolean }> {
    return this.sendPushToAudience({
      audience: OWNER_AUDIENCE,
      ownerUserId: params.ownerUserId,
      payload: params.payload,
    });
  }

  async sendClientPortalPushNotification(params: {
    ownerUserId: string;
    clientAuthUserId: string;
    payload: PushNotificationPayload;
  }): Promise<{ failed: number; sent: number; skipped: boolean }> {
    return this.sendPushToAudience({
      audience: CLIENT_PORTAL_AUDIENCE,
      ownerUserId: params.ownerUserId,
      authUserId: params.clientAuthUserId,
      payload: params.payload,
    });
  }

  private async sendPushToAudience(params: {
    audience: string;
    ownerUserId: string;
    authUserId?: string;
    payload: PushNotificationPayload;
  }): Promise<{ failed: number; sent: number; skipped: boolean }> {
    if (!this.isConfigured()) {
      return { failed: 0, sent: 0, skipped: true };
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: {
        ownerUserId: params.ownerUserId,
        audience: params.audience,
        ...(params.authUserId ? { authUserId: params.authUserId } : {}),
      },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    if (subscriptions.length === 0) {
      return { failed: 0, sent: 0, skipped: false };
    }

    const push = this.ensureWebPush();
    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await push.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                auth: subscription.auth,
                p256dh: subscription.p256dh,
              },
            },
            JSON.stringify(params.payload),
          );
          sent += 1;
        } catch (error) {
          failed += 1;
          const statusCode = readWebPushErrorStatus(error);
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription
              .delete({ where: { id: subscription.id } })
              .catch((e) =>
                this.logger.warn(`Failed to delete stale push subscription: ${String(e)}`),
              );
          }
        }
      }),
    );

    return { failed, sent, skipped: false };
  }
}
