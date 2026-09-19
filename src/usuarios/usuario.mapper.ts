export interface CatalogoRef {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface UsuarioRow {
  id: number;
  auth_id: string | null;
  identificacion: string;
  usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  id_estado: number;
  id_rol: number;
  fecha_creacion: string;
  fecha_ultima_modificacion: string | null;
  estado?: CatalogoRef | CatalogoRef[] | null;
  rol?:
    | (CatalogoRef & {
        rol_permiso?: { permiso: { codigo: string } | { codigo: string }[] | null }[];
      })
    | (CatalogoRef & {
        rol_permiso?: { permiso: { codigo: string } | { codigo: string }[] | null }[];
      })[]
    | null;
}

export const USUARIO_SELECT = `
  id, auth_id, identificacion, usuario, nombre, apellido, email,
  id_estado, id_rol, fecha_creacion, fecha_ultima_modificacion,
  estado:estado ( id, nombre ),
  rol:rol (
    id, nombre, descripcion,
    rol_permiso ( permiso:permiso ( codigo ) )
  )
`.trim();

export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function toUsuarioDto(row: UsuarioRow) {
  const estado = one(row.estado);
  const rol = one(row.rol);
  return {
    id: row.id,
    authId: row.auth_id,
    identificacion: row.identificacion,
    usuario: row.usuario,
    nombre: row.nombre,
    apellido: row.apellido,
    email: row.email,
    idEstado: row.id_estado,
    idRol: row.id_rol,
    fechaCreacion: row.fecha_creacion,
    fechaUltimaModificacion: row.fecha_ultima_modificacion,
    estado: estado ? { id: estado.id, nombre: estado.nombre } : null,
    rol: rol
      ? { id: rol.id, nombre: rol.nombre, descripcion: rol.descripcion ?? null }
      : null,
    permisos: extractPermisos(row),
  };
}

export function extractPermisos(row: UsuarioRow): string[] {
  const rol = one(row.rol);
  if (!rol?.rol_permiso) return [];
  return rol.rol_permiso
    .map((item) => one(item.permiso)?.codigo)
    .filter((codigo): codigo is string => Boolean(codigo));
}

export function toAuthUser(row: UsuarioRow) {
  const dto = toUsuarioDto(row);
  return {
    id: dto.id,
    authId: dto.authId,
    identificacion: dto.identificacion,
    usuario: dto.usuario,
    nombre: dto.nombre,
    apellido: dto.apellido,
    email: dto.email,
    idEstado: dto.idEstado,
    idRol: dto.idRol,
    estado: dto.estado?.nombre ?? '',
    rol: dto.rol?.nombre ?? '',
    permisos: dto.permisos,
  };
}
