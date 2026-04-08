import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RecommendationsLlmService } from "./recommendations-llm.service";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";

@Module({
  imports: [AuthModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RecommendationsLlmService],
})
export class RecommendationsModule {}
