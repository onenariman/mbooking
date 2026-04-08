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
import { AppointmentsService } from "./appointments.service";
import { CompleteAppointmentDto } from "./dto/complete-appointment.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

@Controller("appointments")
@UseGuards(JwtAuthGuard, OwnerRoleGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async list(@CurrentUser("sub") userId: string) {
    const data = await this.appointmentsService.listForOwner(userId);
    return { data };
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  async complete(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CompleteAppointmentDto,
  ) {
    const data = await this.appointmentsService.completeForOwner(userId, id, dto);
    return { data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    const data = await this.appointmentsService.createForOwner(userId, dto);
    return { data };
  }

  @Patch(":id")
  async update(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    const data = await this.appointmentsService.updateForOwner(userId, id, dto);
    return { data };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser("sub") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    await this.appointmentsService.deleteForOwner(userId, id);
    return { data: true };
  }
}
