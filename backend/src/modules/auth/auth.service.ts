import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { expiresInToDate } from "../../common/utils/parse-jwt-expires";
import { PrismaService } from "../../prisma/prisma.service";
import {
  generateOpaqueRefreshToken,
  hashRefreshToken,
} from "./auth.tokens.util";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: LoginDto) {
    if (process.env.OWNER_PASSWORD_REGISTRATION_ENABLED === "false") {
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

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

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
