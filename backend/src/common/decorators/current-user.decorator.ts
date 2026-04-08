import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type JwtRequestUser = {
  sub: string;
  email: string;
  role: string;
  type: "access" | "refresh";
};

export const CurrentUser = createParamDecorator(
  (prop: keyof JwtRequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtRequestUser }>();
    const user = request.user;
    return prop ? user[prop] : user;
  },
);
