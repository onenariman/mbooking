import {
  Body,
  Controller,
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
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { DiscountsService } from "./discounts.service";

@Controller("discounts")
@UseGuards(JwtAuthGuard, OwnerRoleGuard)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  async list(
    @CurrentUser("sub") userId: string,
    @Query("phone") phone?: string,
    @Query("service_id") serviceId?: string,
    @Query("is_used") isUsedRaw?: string,
  ) {
    let isUsed: boolean | undefined;
    if (isUsedRaw === "true") {
      isUsed = true;
    } else if (isUsedRaw === "false") {
      isUsed = false;
    }

    const data = await this.discountsService.listForOwner(userId, {
      phone: phone ?? null,
      serviceId: serviceId ?? null,
      isUsed,
    });
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateDiscountDto,
  ) {
    const data = await this.discountsService.createManualForOwner(userId, dto);
    return { data };
  }

  @Patch(":id/use")
  async markUsed(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const data = await this.discountsService.markUsedForOwner(userId, id);
    return { data };
  }
}
