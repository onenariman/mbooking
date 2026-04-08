import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OwnerRoleGuard } from "../../common/guards/owner-role.guard";
import { CreateFeedbackTokenDto } from "./dto/create-feedback-token.dto";
import { SubmitFeedbackDto } from "./dto/submit-feedback.dto";
import { FeedbackService } from "./feedback.service";

@Controller("feedback")
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Post("submit")
  async submit(@Body() dto: SubmitFeedbackDto) {
    const data = await this.feedbackService.submit(dto);
    return { data };
  }

  @Public()
  @Get("validate")
  async validate(@Query("token") token: string) {
    const data = await this.feedbackService.validateToken(token ?? "");
    return { data };
  }

  @UseGuards(OwnerRoleGuard)
  @Post("token")
  async createToken(
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateFeedbackTokenDto,
  ) {
    const data = await this.feedbackService.createTokenForOwner(userId, dto);
    return { data };
  }

  @UseGuards(OwnerRoleGuard)
  @Get("responses")
  async listResponses(
    @CurrentUser("sub") userId: string,
    @Query("period") period?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const data = await this.feedbackService.listResponsesForOwner(userId, {
      period,
      from,
      to,
    });
    return { data };
  }

  @UseGuards(OwnerRoleGuard)
  @Delete("responses")
  async deleteResponse(
    @CurrentUser("sub") userId: string,
    @Query("id") id: string,
  ) {
    if (!id?.trim()) {
      throw new BadRequestException("Не задан id");
    }
    await this.feedbackService.deleteResponseForOwner(userId, id.trim());
    return { data: true };
  }

  @UseGuards(OwnerRoleGuard)
  @Get("ratings")
  async ratings(
    @CurrentUser("sub") userId: string,
    @Query("period") period?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const data = await this.feedbackService.ratingsTrendForOwner(userId, {
      period,
      from,
      to,
    });
    return { data };
  }
}
