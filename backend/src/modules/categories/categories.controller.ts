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
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OwnerRoleGuard } from "../../common/guards/owner-role.guard";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("categories")
@UseGuards(JwtAuthGuard, OwnerRoleGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async list(@CurrentUser("sub") userId: string) {
    const data = await this.categoriesService.listForOwner(userId);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const data = await this.categoriesService.createForOwner(userId, dto);
    return { data };
  }

  @Patch(":id")
  async update(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.updateForOwner(userId, id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    await this.categoriesService.deleteForOwner(userId, id);
    return { data: true };
  }
}
