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
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { YandexTokenDto } from "./dto/yandex-token.dto";

const LOGIN_LIMIT = { auth: { ttl: 60_000, limit: 5 } };
const REGISTER_LIMIT = { auth: { ttl: 60_000, limit: 3 } };
const REFRESH_LIMIT = { auth: { ttl: 60_000, limit: 20 } };
const LOGOUT_LIMIT = { auth: { ttl: 60_000, limit: 20 } };
const YANDEX_TOKEN_LIMIT = { auth: { ttl: 60_000, limit: 30 } };

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle(REGISTER_LIMIT)
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: LoginDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle(LOGIN_LIMIT)
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle(YANDEX_TOKEN_LIMIT)
  @Post("yandex/token")
  @HttpCode(HttpStatus.OK)
  yandexToken(
    @Headers("x-oauth-callback-secret") secret: string | undefined,
    @Body() dto: YandexTokenDto,
  ) {
    return this.authService.signInWithYandexCode(dto.code, secret);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle(REFRESH_LIMIT)
  @Post("refresh")
  refresh(@Headers("authorization") authorizationHeader?: string) {
    const refreshToken = authorizationHeader?.replace("Bearer ", "").trim();
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }
    return this.authService.refresh(refreshToken);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle(LOGOUT_LIMIT)
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
