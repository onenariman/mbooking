import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: LoginDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  refresh(@Headers("authorization") authorizationHeader?: string) {
    const refreshToken = authorizationHeader?.replace("Bearer ", "").trim();
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }
    return this.authService.refresh(refreshToken);
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    const data = await this.authService.logout(dto.refresh_token);
    return { data };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: { user: { sub: string; email: string; role: string } }) {
    return this.authService.me(req.user);
  }
}
