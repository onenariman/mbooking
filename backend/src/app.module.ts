import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { appConfig } from "./config/app.config";
import { validateEnv } from "./config/env.schema";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ClientPortalModule } from "./modules/client-portal/client-portal.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { DiscountsModule } from "./modules/discounts/discounts.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { HealthModule } from "./modules/health/health.module";
import { OwnerOrganizationModule } from "./modules/owner-organization/owner-organization.module";
import { PushModule } from "./modules/push/push.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";
import { ServicesModule } from "./modules/services/services.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "auth",
          ttl: 60_000,
          limit: 120,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    ClientsModule,
    ClientPortalModule,
    CategoriesModule,
    ServicesModule,
    AppointmentsModule,
    DiscountsModule,
    FeedbackModule,
    PushModule,
    RecommendationsModule,
    OwnerOrganizationModule,
  ],
})
export class AppModule {}
