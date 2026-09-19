import { RoleName } from './constants';

export interface AuthUser {
  id: number;
  authId: string | null;
  identificacion: string;
  usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  idEstado: number;
  idRol: number;
  estado: string;
  rol: string;
  permisos: string[];
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export function hasPermission(user: AuthUser, permission: string) {
  return user.rol === 'ADMINISTRADOR' || user.permisos.includes(permission);
}

export function hasRole(user: AuthUser, roles: RoleName[]) {
  return roles.includes(user.rol as RoleName);
}
