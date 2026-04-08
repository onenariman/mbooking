import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PushModule } from "../push/push.module";
import { ClientPortalController } from "./client-portal.controller";
import { ClientPortalContextService } from "./client-portal-context.service";
import { ClientPortalInvitationsService } from "./client-portal-invitations.service";

@Module({
  imports: [AuthModule, PushModule],
  controllers: [ClientPortalController],
  providers: [ClientPortalContextService, ClientPortalInvitationsService],
})
export class ClientPortalModule {}
