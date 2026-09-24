import { Body, Controller, ForbiddenException, Get, Headers, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION, ROLE } from '../common/constants';
import { AuthUser } from '../common/types';
import { attachAuthCookies, clearAuthCookies, REFRESH_COOKIE } from './auth-cookies';
import { AuthService } from './auth.service';
import { BootstrapDto, LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto);
    attachAuthCookies(res, result);
    return { expiresIn: result.expiresIn, user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken || req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    const result = await this.auth.refresh(token);
    attachAuthCookies(res, result);
    return { expiresIn: result.expiresIn, user: result.user };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookies(res);
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('bootstrap')
  bootstrap(@Body() dto: BootstrapDto, @Headers('x-bootstrap-secret') secret?: string) {
    const expected = this.config.get<string>('BOOTSTRAP_SECRET');
    if (!expected || secret !== expected) {
      throw new ForbiddenException('Bootstrap deshabilitado');
    }
    return this.auth.bootstrap(dto);
  }

  @Post('register')
  @ApiBearerAuth()
  @Roles(ROLE.ADMINISTRADOR)
  @RequirePermissions(PERMISSION.USUARIO_CREAR)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }
}
