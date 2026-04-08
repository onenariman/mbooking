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
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServicesService } from "./services.service";

@Controller("services")
@UseGuards(JwtAuthGuard, OwnerRoleGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async list(@CurrentUser("sub") userId: string) {
    const data = await this.servicesService.listForOwner(userId);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateServiceDto,
  ) {
    const data = await this.servicesService.createForOwner(userId, dto);
    return { data };
  }

  @Patch(":id")
  async update(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    const data = await this.servicesService.updateForOwner(userId, id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    await this.servicesService.deleteForOwner(userId, id);
    return { data: true };
  }
}
