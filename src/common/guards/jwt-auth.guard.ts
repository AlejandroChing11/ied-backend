import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../constants';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      cookies?: { ied_at?: string };
      user?: unknown;
    }>();
    const header = request.headers.authorization ?? '';
    const [scheme, bearer] = header.split(' ');
    const token = scheme === 'Bearer' && bearer ? bearer : request.cookies?.ied_at;
    if (!token) {
      throw new UnauthorizedException('Token de acceso requerido');
    }
    request.user = await this.authService.validateAccessToken(token);
    return true;
  }
}
