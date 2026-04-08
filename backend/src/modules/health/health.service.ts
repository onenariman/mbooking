import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async getHealth() {
    let database: "up" | "down" = "up";
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
    } catch {
      database = "down";
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      env: this.configService.get<string>("app.nodeEnv", "development"),
      database,
    };
  }
}
