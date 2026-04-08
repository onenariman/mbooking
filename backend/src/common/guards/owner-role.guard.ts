import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class OwnerRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: string };
    }>();
    if (request.user?.role !== "owner") {
      throw new ForbiddenException();
    }
    return true;
  }
}
