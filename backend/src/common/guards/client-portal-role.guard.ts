import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class ClientPortalRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: string };
    }>();
    if (request.user?.role !== "client_portal") {
      throw new ForbiddenException();
    }
    return true;
  }
}
