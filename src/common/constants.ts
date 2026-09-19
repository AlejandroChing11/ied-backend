/** Schema PostgreSQL en Supabase. El guion exige comillas en SQL. */
export const DB_SCHEMA = 'proyecto-universidad' as const;

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const AUDIT_KEY = 'auditMeta';

export const ROLE = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  COORDINADOR: 'COORDINADOR',
  DOCENTE: 'DOCENTE',
  ESTUDIANTE: 'ESTUDIANTE',
  ACUDIENTE: 'ACUDIENTE',
} as const;

export type RoleName = (typeof ROLE)[keyof typeof ROLE];

export const PERMISSION = {
  USUARIO_VER: 'usuario.ver',
  USUARIO_CREAR: 'usuario.crear',
  USUARIO_EDITAR: 'usuario.editar',
  ROL_ASIGNAR: 'rol.asignar',
  ROL_VER: 'rol.ver',
  CARGA_CSV: 'carga.csv',
  ACADEMICO_VER: 'academico.ver',
  ACADEMICO_GESTIONAR: 'academico.gestionar',
  MATRICULA_VER: 'matricula.ver',
  MATRICULA_CREAR: 'matricula.crear',
  ASIGNACION_VER: 'asignacion.ver',
  ASIGNACION_CREAR: 'asignacion.crear',
  VINCULO_VER: 'vinculo.ver',
  VINCULO_CREAR: 'vinculo.crear',
  AUDITORIA_VER: 'auditoria.ver',
  EXCUSA_VER: 'excusa.ver',
  EXCUSA_RADICAR: 'excusa.radicar',
  EXCUSA_RESOLVER: 'excusa.resolver',
  CONVIVENCIA_VER: 'convivencia.ver',
  CONVIVENCIA_REPORTAR: 'convivencia.reportar',
  ARCHIVO_READ_CONFIDENCIAL: 'archivo.read_confidencial',
  EXCUSA_READ_CONFIDENCIAL: 'excusa.read_confidencial',
  CONVIVENCIA_READ_CONFIDENCIAL: 'convivencia.read_confidencial',
} as const;

export const ESTADO = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  BLOQUEADO: 'BLOQUEADO',
} as const;

export const ESTADO_PROCESO = {
  RADICADA: 'Radicada',
  EN_REVISION: 'En revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
} as const;

export const ENTIDAD_ARCHIVO = {
  EXCUSA: 'EXCUSA',
  SITUACION_CONVIVENCIA: 'SITUACION_CONVIVENCIA',
} as const;
