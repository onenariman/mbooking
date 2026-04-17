import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import {
  OAuthProvider,
  OwnerSubscriptionStatus,
  Prisma,
  UserAuthType,
  UserRole,
} from "@prisma/client";
import { expiresInToDate } from "../../common/utils/parse-jwt-expires";
import { PrismaService } from "../../prisma/prisma.service";
import {
  generateOpaqueRefreshToken,
  hashRefreshToken,
} from "./auth.tokens.util";
import { LoginDto } from "./dto/login.dto";

type YandexTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type YandexLoginInfo = {
  id?: string | number;
  login?: string;
  default_email?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private isOwnerPasswordRegistrationEnabled(): boolean {
    return (
      this.configService.get<boolean>("app.auth.ownerPasswordRegistrationEnabled") ===
      true
    );
  }

  private isOwnerPasswordLoginEnabled(): boolean {
    return (
      this.configService.get<boolean>("app.auth.ownerPasswordLoginEnabled") ===
      true
    );
  }

  async register(dto: LoginDto) {
    if (!this.isOwnerPasswordRegistrationEnabled()) {
      throw new ForbiddenException("Регистрация по паролю отключена");
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException("Этот email уже зарегистрирован");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.owner,
        isActive: true,
        authType: UserAuthType.password,
      },
    });

    return this.login(dto);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    if (user.role === UserRole.owner && !this.isOwnerPasswordLoginEnabled()) {
      throw new UnauthorizedException(
        "Вход по паролю отключён. Войдите через Яндекс.",
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    return this.issueTokenPair(user);
  }

  async signInWithYandexCode(code: string, callbackSecret: string | undefined) {
    const expected = this.configService
      .get<string>("app.oauthCallbackSecret")
      ?.trim();
    if (!expected || callbackSecret?.trim() !== expected) {
      throw new UnauthorizedException();
    }

    const clientId = this.configService
      .get<string>("app.yandexOAuth.clientId")
      ?.trim();
    const clientSecret = this.configService
      .get<string>("app.yandexOAuth.clientSecret")
      ?.trim();
    const redirectUri = this.configService
      .get<string>("app.yandexOAuth.redirectUri")
      ?.trim();
    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException("Yandex OAuth is not configured");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
    const tokenJson = (await tokenRes.json()) as YandexTokenResponse;
    if (!tokenRes.ok || !tokenJson.access_token) {
      throw new UnauthorizedException("Yandex OAuth token exchange failed");
    }

    const infoRes = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${tokenJson.access_token}` },
    });
    const info = (await infoRes.json()) as YandexLoginInfo;
    if (!infoRes.ok || info.id === undefined || info.id === null) {
      throw new UnauthorizedException("Yandex profile request failed");
    }

    const yandexId = String(info.id);
    const emailFromYandex =
      typeof info.default_email === "string" && info.default_email.trim()
        ? info.default_email.trim().toLowerCase()
        : null;
    const login =
      typeof info.login === "string" && info.login.trim()
        ? info.login.trim()
        : null;
    const preferredEmail =
      emailFromYandex ??
      (login
        ? `${login}@yandex.oauth.invalid`
        : `yandex_${yandexId}@yandex.oauth.invalid`);

    const rawProfile = JSON.parse(JSON.stringify(info)) as Prisma.InputJsonValue;

    const user = await this.prisma.$transaction(async (tx) => {
      const existingLink = await tx.oAuthIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: OAuthProvider.yandex,
            providerUserId: yandexId,
          },
        },
        include: { user: true },
      });
      if (existingLink?.user) {
        const u = existingLink.user;
        if (!u.isActive) {
          throw new ForbiddenException("Аккаунт отключён");
        }
        return u;
      }

      let chosenEmail = preferredEmail;
      let collision = await tx.user.findUnique({
        where: { email: chosenEmail },
      });
      if (collision && collision.role !== UserRole.owner) {
        chosenEmail = `yandex_${yandexId}@yandex.oauth.invalid`;
        collision = await tx.user.findUnique({
          where: { email: chosenEmail },
        });
      }

      if (collision && collision.role === UserRole.owner) {
        await tx.oAuthIdentity.create({
          data: {
            userId: collision.id,
            provider: OAuthProvider.yandex,
            providerUserId: yandexId,
            providerEmail: emailFromYandex,
            rawProfile,
          },
        });
        await tx.user.update({
          where: { id: collision.id },
          data: {
            authType: UserAuthType.oauth_yandex,
            passwordHash: null,
          },
        });
        return collision;
      }

      const fresh = await tx.user.create({
        data: {
          email: chosenEmail,
          passwordHash: null,
          role: UserRole.owner,
          authType: UserAuthType.oauth_yandex,
          isActive: true,
        },
      });

      await tx.oAuthIdentity.create({
        data: {
          userId: fresh.id,
          provider: OAuthProvider.yandex,
          providerUserId: yandexId,
          providerEmail: emailFromYandex,
          rawProfile,
        },
      });

      const trialEnd = new Date();
      trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);

      await tx.ownerSubscription.create({
        data: {
          ownerUserId: fresh.id,
          status: OwnerSubscriptionStatus.trial,
          trialStartedAt: new Date(),
          trialEndsAt: trialEnd,
        },
      });

      return fresh;
    });

    return this.issueTokenPair(user);
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = hashRefreshToken(rawRefreshToken.trim());
    const row = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!row) {
      throw new UnauthorizedException("Недействительный refresh-токен");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: row.userId },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException("Недействительный refresh-токен");
    }

    const accessToken = await this.signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const newRaw = await this.rotateRefreshToken(row.id, user.id);

    return {
      accessToken,
      refreshToken: newRaw,
      tokenType: "Bearer" as const,
    };
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = hashRefreshToken(rawRefreshToken.trim());
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return true;
  }

  me(user: { sub: string; email: string; role: string }) {
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }

  private async issueTokenPair(user: {
    id: string;
    email: string;
    role: UserRole;
  }) {
    const accessToken = await this.signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await this.createRefreshSession(user.id);
    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer" as const,
    };
  }

  private async signAccessToken(user: {
    id: string;
    email: string;
    role: UserRole;
  }) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: "access" as const,
      },
      {
        secret: this.configService.getOrThrow<string>("app.jwt.accessSecret"),
        expiresIn: this.configService.getOrThrow<string>(
          "app.jwt.accessExpiresIn",
        ) as never,
      },
    );
  }

  private async createRefreshSession(userId: string): Promise<string> {
    const raw = generateOpaqueRefreshToken();
    const refreshExpiresIn = this.configService.getOrThrow<string>(
      "app.jwt.refreshExpiresIn",
    );
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(raw),
        expiresAt: expiresInToDate(refreshExpiresIn),
      },
    });
    return raw;
  }

  /** Отзыв старой сессии и выдача нового refresh (ротация). */
  private async rotateRefreshToken(
    oldTokenId: string,
    userId: string,
  ): Promise<string> {
    const raw = generateOpaqueRefreshToken();
    const refreshExpiresIn = this.configService.getOrThrow<string>(
      "app.jwt.refreshExpiresIn",
    );
    const expiresAt = expiresInToDate(refreshExpiresIn);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: oldTokenId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: hashRefreshToken(raw),
          expiresAt,
        },
      }),
    ]);

    return raw;
  }
}
