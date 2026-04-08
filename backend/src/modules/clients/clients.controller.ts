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
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@Controller("clients")
@UseGuards(JwtAuthGuard, OwnerRoleGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async list(@CurrentUser("sub") userId: string) {
    const data = await this.clientsService.listForOwner(userId);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateClientDto,
  ) {
    const data = await this.clientsService.createForOwner(userId, dto);
    return { data };
  }

  @Patch(":id")
  async update(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    const data = await this.clientsService.updateForOwner(userId, id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    await this.clientsService.deleteForOwner(userId, id);
    return { data: true };
  }
}
