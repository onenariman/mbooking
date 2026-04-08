import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";

type AuthUser = {
  id: string;
  email: string;
  role: "owner";
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user: AuthUser = {
      id: "bootstrap-owner-id",
      email: dto.email,
      role: "owner",
    };
    return this.signTokens(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      email: string;
      role: "owner";
      type: "refresh";
    }>(refreshToken, {
      secret: this.configService.getOrThrow<string>("app.jwt.refreshSecret"),
    });

    return this.signTokens({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  }

  me(user: { sub: string; email: string; role: string }) {
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }

  private async signTokens(user: AuthUser) {
    const accessToken = await this.jwtService.signAsync(
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

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: "refresh" as const,
      },
      {
        secret: this.configService.getOrThrow<string>("app.jwt.refreshSecret"),
        expiresIn: this.configService.getOrThrow<string>(
          "app.jwt.refreshExpiresIn",
        ) as never,
      },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
    };
  }
}
