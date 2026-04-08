import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OwnerRoleGuard } from "../../common/guards/owner-role.guard";
import { CreateRecommendationJobDto } from "./dto/create-recommendation-job.dto";
import { CreateRecommendationPromptDto } from "./dto/create-recommendation-prompt.dto";
import { ListRecommendationsQueryDto } from "./dto/list-recommendations-query.dto";
import { UpdateRecommendationPromptDto } from "./dto/update-recommendation-prompt.dto";
import { RecommendationsService } from "./recommendations.service";

@Controller("recommendations")
@UseGuards(JwtAuthGuard, OwnerRoleGuard)
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get()
  async listAi(
    @CurrentUser("sub") userId: string,
    @Query() query: ListRecommendationsQueryDto,
  ) {
    const data = await this.recommendations.listAiRecommendations(userId, query);
    return { data };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAi(
    @CurrentUser("sub") userId: string,
    @Query("id", ParseUUIDPipe) id: string,
  ) {
    const data = await this.recommendations.deleteAiRecommendation(userId, id);
    return { data };
  }

  @Post("jobs")
  @HttpCode(HttpStatus.OK)
  async createJob(
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateRecommendationJobDto,
  ) {
    const data = await this.recommendations.createJob(userId, dto);
    return { data };
  }

  @Post("generate")
  @HttpCode(HttpStatus.OK)
  async generate(@CurrentUser("sub") userId: string, @Body() dto: CreateRecommendationJobDto) {
    const data = await this.recommendations.createJob(userId, dto);
    return { data };
  }

  @Get("jobs/:id")
  async getJob(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const data = await this.recommendations.getJob(userId, id);
    return { data };
  }

  @Post("jobs/:id/run")
  @HttpCode(HttpStatus.OK)
  async runJob(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const data = await this.recommendations.runJob(userId, id);
    return { data };
  }

  @Get("prompts")
  async listPrompts(@CurrentUser("sub") userId: string) {
    const data = await this.recommendations.listPrompts(userId);
    return { data };
  }

  @Post("prompts")
  @HttpCode(HttpStatus.CREATED)
  async createPrompt(
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateRecommendationPromptDto,
  ) {
    const data = await this.recommendations.createPrompt(userId, dto);
    return { data };
  }

  @Patch("prompts")
  @HttpCode(HttpStatus.OK)
  async updatePrompt(
    @CurrentUser("sub") userId: string,
    @Query("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecommendationPromptDto,
  ) {
    const data = await this.recommendations.updatePrompt(userId, id, dto);
    return { data };
  }

  @Delete("prompts")
  @HttpCode(HttpStatus.OK)
  async deletePrompt(
    @CurrentUser("sub") userId: string,
    @Query("id", ParseUUIDPipe) id: string,
  ) {
    const data = await this.recommendations.deletePrompt(userId, id);
    return { data };
  }
}
