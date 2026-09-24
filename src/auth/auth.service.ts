import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { AuthUser } from '../common/types';
import { ESTADO } from '../common/constants';
import { UsuariosService } from '../usuarios/usuarios.service';
import { toAuthUser } from '../usuarios/usuario.mapper';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { BootstrapDto, LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly usuarios: UsuariosService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async validateAccessToken(token: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.admin.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    const row = await this.usuarios.findRowByAuthId(data.user.id);
    if (!row) throw new UnauthorizedException('Perfil de usuario no encontrado');
    if (row.estado && toAuthUser(row).estado !== ESTADO.ACTIVO) {
      throw new ForbiddenException('La cuenta está inactiva o bloqueada');
    }
    const user = toAuthUser(row);
    if (user.estado !== ESTADO.ACTIVO) {
      throw new ForbiddenException('La cuenta está inactiva o bloqueada');
    }
    return user;
  }

  async login(dto: LoginDto) {
    const row = await this.usuarios.findRowByUsuarioOrEmail(dto.usuario.trim());
    if (!row) throw new UnauthorizedException('Credenciales inválidas');
    const profile = toAuthUser(row);
    if (profile.estado !== ESTADO.ACTIVO) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { data, error } = await this.supabase.anon.auth.signInWithPassword({
      email: profile.email,
      password: dto.contrasena,
    });
    if (error || !data.session) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.auditoria.registrar({
      idUsuario: profile.id,
      accion: 'Inició sesión',
      entidad: 'Sesión',
      idEntidad: profile.id,
      detalle: `Acceso de ${profile.rol}`,
    });

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: profile,
    };
  }

  async refresh(refreshToken: string) {
    const { data, error } = await this.supabase.anon.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    const row = await this.usuarios.findRowByAuthId(data.user.id);
    if (!row) throw new UnauthorizedException('Perfil de usuario no encontrado');
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: toAuthUser(row),
    };
  }

  async register(dto: RegisterDto) {
    return this.usuarios.create(dto);
  }

  async bootstrap(dto: BootstrapDto) {
    return this.usuarios.createBootstrapAdmin(dto);
  }

  me(user: AuthUser) {
    return user;
  }
}
