import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OwnerRoleGuard } from "../../common/guards/owner-role.guard";
import { PatchOwnerOrganizationDto } from "./dto/patch-owner-organization.dto";
import { OwnerOrganizationService } from "./owner-organization.service";

@Controller("owner/organization")
@UseGuards(JwtAuthGuard, OwnerRoleGuard)
export class OwnerOrganizationController {
  constructor(private readonly orgService: OwnerOrganizationService) {}

  @Get()
  async get(@CurrentUser("sub") userId: string) {
    const data = await this.orgService.getForOwner(userId);
    return { data };
  }

  @Patch()
  async patch(
    @CurrentUser("sub") userId: string,
    @Body() dto: PatchOwnerOrganizationDto,
  ) {
    const data = await this.orgService.patchForOwner(userId, dto);
    return { data };
  }
}

