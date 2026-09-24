import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ESTADO } from '../common/constants';
import { UsuarioRow } from '../usuarios/usuario.mapper';

function row(overrides: Partial<UsuarioRow> = {}): UsuarioRow {
  return {
    id: 1,
    auth_id: 'auth-1',
    identificacion: '123',
    usuario: 'cmendoza',
    nombre: 'Carlos',
    apellido: 'Mendoza',
    email: 'cmendoza@iedlavictoria.edu.co',
    id_estado: 1,
    id_rol: 1,
    fecha_creacion: '2026-01-01',
    fecha_ultima_modificacion: null,
    estado: { id: 1, nombre: ESTADO.ACTIVO },
    rol: {
      id: 1,
      nombre: 'ADMINISTRADOR',
      rol_permiso: [{ permiso: { codigo: 'usuario.ver' } }],
    },
    ...overrides,
  };
}

describe('AuthService', () => {
  const supabase = {
    admin: { auth: { getUser: jest.fn() } },
    anon: { auth: { signInWithPassword: jest.fn(), refreshSession: jest.fn() } },
  };
  const usuarios = {
    findRowByAuthId: jest.fn(),
    findRowByUsuarioOrEmail: jest.fn(),
    create: jest.fn(),
    createBootstrapAdmin: jest.fn(),
  };
  const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(supabase as any, usuarios as any, auditoria as any);
  });

  it('validateAccessToken rechaza token inválido', async () => {
    supabase.admin.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } });
    await expect(service.validateAccessToken('x')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login autentica por usuario y registra auditoría', async () => {
    usuarios.findRowByUsuarioOrEmail.mockResolvedValue(row());
    supabase.anon.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: 'a', refresh_token: 'r', expires_in: 3600 },
      },
      error: null,
    });

    const result = await service.login({ usuario: 'cmendoza', contrasena: 'Admin123!' });
    expect(result.accessToken).toBe('a');
    expect(result.user.rol).toBe('ADMINISTRADOR');
    expect(auditoria.registrar).toHaveBeenCalled();
  });

  it('login bloquea cuentas inactivas', async () => {
    usuarios.findRowByUsuarioOrEmail.mockResolvedValue(
      row({ estado: { id: 2, nombre: 'INACTIVO' } }),
    );
    await expect(
      service.login({ usuario: 'cmendoza', contrasena: 'Admin123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
