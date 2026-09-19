import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { AuthUser } from '../types';

function contextWith(user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}

const docente: AuthUser = {
  id: 3,
  authId: 'x',
  identificacion: '1',
  usuario: 'doc',
  nombre: 'Ana',
  apellido: 'Pérez',
  email: 'ana@colegio.edu',
  idEstado: 1,
  idRol: 3,
  estado: 'ACTIVO',
  rol: 'DOCENTE',
  permisos: ['excusa.ver', 'convivencia.reportar'],
};

describe('PermissionsGuard', () => {
  it('permite cuando no hay metadata de permisos', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    expect(guard.canActivate(contextWith(docente))).toBe(true);
  });

  it('permite si el usuario tiene el permiso', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['excusa.ver']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    expect(guard.canActivate(contextWith(docente))).toBe(true);
  });

  it('rechaza si falta el permiso', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['usuario.crear']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    expect(() => guard.canActivate(contextWith(docente))).toThrow(ForbiddenException);
  });

  it('el administrador pasa aunque no liste el permiso', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['usuario.crear']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    expect(
      guard.canActivate(
        contextWith({ ...docente, rol: 'ADMINISTRADOR', permisos: [] }),
      ),
    ).toBe(true);
  });
});
