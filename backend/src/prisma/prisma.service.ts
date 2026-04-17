import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    const nodeEnv =
      this.configService.get<string>("app.nodeEnv") ?? "development";
    const allowSoftStart =
      this.configService.get<boolean>("app.database.allowStartWithoutDb") ??
      false;
    const isProduction = nodeEnv === "production";

    try {
      await this.$connect();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown error";

      if (isProduction) {
        this.logger.error(`Prisma connection failed in production: ${message}`);
        throw error;
      }

      if (!allowSoftStart) {
        this.logger.error(
          `Prisma connection failed (set ALLOW_START_WITHOUT_DB=true to allow dev start without DB): ${message}`,
        );
        throw error;
      }

      this.logger.warn(
        `Prisma startup connection skipped (ALLOW_START_WITHOUT_DB=true): ${message}`,
      );
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
