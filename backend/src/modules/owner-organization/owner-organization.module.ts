import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OwnerOrganizationController } from "./owner-organization.controller";
import { OwnerOrganizationService } from "./owner-organization.service";

@Module({
  imports: [AuthModule],
  controllers: [OwnerOrganizationController],
  providers: [OwnerOrganizationService],
})
export class OwnerOrganizationModule {}

