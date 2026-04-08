import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isObservable, lastValueFrom } from "rxjs";
import type { JwtRequestUser } from "../../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";

type DispatchRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: JwtRequestUser;
  reminderDispatchMode?: "all" | "self";
};

function getDispatchHeaderToken(req: DispatchRequest): string | null {
  const auth = req.headers["authorization"];
  const authStr = Array.isArray(auth) ? auth[0] : auth;
  if (typeof authStr === "string" && authStr.startsWith("Bearer ")) {
    return authStr.slice("Bearer ".length).trim();
  }
  const cron = req.headers["x-cron-secret"];
  const cronStr = Array.isArray(cron) ? cron[0] : cron;
  return typeof cronStr === "string" ? cronStr.trim() : null;
}

@Injectable()
export class RemindersDispatchAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<DispatchRequest>();
    const cronSecret = this.config.get<string>("app.cronSecret") ?? "";
    const headerToken = getDispatchHeaderToken(req);

    if (cronSecret.length > 0 && headerToken === cronSecret) {
      req.reminderDispatchMode = "all";
      return true;
    }

    let ok: boolean;
    try {
      const outcome = this.jwtAuthGuard.canActivate(context);
      ok = await this.toBoolean(outcome);
    } catch {
      throw new UnauthorizedException("Не авторизован");
    }

    if (!ok) {
      throw new UnauthorizedException("Не авторизован");
    }

    const user = req.user;
    if (!user || user.role !== "owner") {
      throw new ForbiddenException();
    }

    req.reminderDispatchMode = "self";
    return true;
  }

  private async toBoolean(
    outcome: boolean | Promise<boolean> | import("rxjs").Observable<boolean>,
  ): Promise<boolean> {
    if (isObservable(outcome)) {
      return lastValueFrom(outcome);
    }
    return outcome;
  }
}
