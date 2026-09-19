-- Catálogos iniciales. Requiere haber ejecutado 001_initial_schema.sql.

SET search_path TO "proyecto-universidad";

INSERT INTO estado (nombre) VALUES
  ('ACTIVO'),
  ('INACTIVO'),
  ('BLOQUEADO');

INSERT INTO rol (nombre, descripcion) VALUES
  ('ADMINISTRADOR', 'Rol de TI: único con CRUD completo de usuarios, roles, configuración y auditoría.'),
  ('COORDINADOR', 'Resuelve excusas, da seguimiento a convivencia y gestiona matrículas y asignaciones.'),
  ('DOCENTE', 'Rol combinado Docente/Psicorientador: reporta convivencia y consulta excusas, sin material confidencial.'),
  ('ESTUDIANTE', 'Radica y edita sus propias excusas dentro del plazo de edición.'),
  ('ACUDIENTE', 'Persona vinculada a uno o más estudiantes mediante parentesco.');

INSERT INTO permiso (codigo, nombre, descripcion) VALUES
  ('usuario.ver', 'Consultar usuarios', 'Ver el directorio de personas y sus roles.'),
  ('usuario.crear', 'Crear usuarios', 'Registrar una persona nueva en el sistema.'),
  ('usuario.editar', 'Editar usuarios', 'Actualizar datos personales y estado.'),
  ('rol.asignar', 'Asignar roles', 'Otorgar o retirar roles a una persona.'),
  ('rol.ver', 'Ver matriz de permisos', 'Consultar qué puede hacer cada rol.'),
  ('carga.csv', 'Carga masiva CSV', 'Importar personas y matrículas desde un archivo.'),
  ('academico.ver', 'Consultar estructura', 'Ver años, grados, cursos y vigencias.'),
  ('academico.gestionar', 'Gestionar estructura', 'Crear o editar cursos y vigencias.'),
  ('matricula.ver', 'Consultar matrículas', 'Ver estudiantes matriculados por curso.'),
  ('matricula.crear', 'Matricular estudiantes', 'Inscribir un estudiante en una vigencia de curso.'),
  ('asignacion.ver', 'Consultar asignaciones', 'Ver docentes a cargo de cada curso.'),
  ('asignacion.crear', 'Asignar docentes', 'Relacionar un docente con una vigencia de curso.'),
  ('vinculo.ver', 'Consultar vínculos', 'Ver relaciones acudiente–estudiante.'),
  ('vinculo.crear', 'Crear vínculos', 'Registrar un parentesco entre acudiente y estudiante.'),
  ('auditoria.ver', 'Ver bitácora', 'Consultar el registro de acciones del sistema.'),
  ('excusa.ver', 'Consultar excusas', 'Ver radicados, estados de proceso y resoluciones.'),
  ('excusa.radicar', 'Radicar excusa', 'Registrar una excusa propia o de un estudiante a cargo.'),
  ('excusa.resolver', 'Resolver excusas', 'Aprobar o rechazar con motivo de resolución.'),
  ('convivencia.ver', 'Consultar situaciones', 'Ver casos, clasificaciones y actuaciones.'),
  ('convivencia.reportar', 'Reportar situación', 'Registrar una situación de convivencia.'),
  ('archivo.read_confidencial', 'Leer archivos confidenciales', 'Descargar anexos marcados como confidenciales.'),
  ('excusa.read_confidencial', 'Leer excusas confidenciales', 'Acceso a material confidencial de excusas.'),
  ('convivencia.read_confidencial', 'Leer convivencia confidencial', 'Acceso a material confidencial de convivencia.');

-- Administrador: todos los permisos
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id, p.id
FROM rol r
CROSS JOIN permiso p
WHERE r.nombre = 'ADMINISTRADOR';

-- Coordinador
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id, p.id
FROM rol r
JOIN permiso p ON p.codigo IN (
  'usuario.ver',
  'academico.ver', 'academico.gestionar',
  'matricula.ver', 'matricula.crear',
  'asignacion.ver', 'asignacion.crear',
  'vinculo.ver',
  'auditoria.ver',
  'excusa.ver', 'excusa.resolver', 'excusa.read_confidencial',
  'convivencia.ver', 'convivencia.reportar', 'convivencia.read_confidencial',
  'archivo.read_confidencial'
)
WHERE r.nombre = 'COORDINADOR';

-- Docente / Psicorientador (sin confidenciales)
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id, p.id
FROM rol r
JOIN permiso p ON p.codigo IN (
  'academico.ver',
  'matricula.ver',
  'excusa.ver',
  'convivencia.ver', 'convivencia.reportar'
)
WHERE r.nombre = 'DOCENTE';

-- Estudiante
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id, p.id
FROM rol r
JOIN permiso p ON p.codigo IN ('excusa.ver', 'excusa.radicar')
WHERE r.nombre = 'ESTUDIANTE';

-- Acudiente
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id, p.id
FROM rol r
JOIN permiso p ON p.codigo IN ('vinculo.ver', 'excusa.ver', 'excusa.radicar')
WHERE r.nombre = 'ACUDIENTE';

INSERT INTO estado_proceso (nombre) VALUES
  ('Radicada'),
  ('En revisión'),
  ('Aprobada'),
  ('Rechazada');

INSERT INTO motivo_resolucion (nombre) VALUES
  ('Justificada'),
  ('No justificada'),
  ('Fuera de plazo');

INSERT INTO clasificacion_convivencia (nombre, descripcion) VALUES
  ('Tipo I', 'Situaciones cotidianas de agresión verbal o gestual.'),
  ('Tipo II', 'Agresión reiterada, acoso escolar o violencia física no constitutiva de delito.'),
  ('Tipo III', 'Situaciones que constituyen presuntos delitos. Exigen actuación inmediata fuera del sistema.');

INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('plazo_edicion_excusa', '1', 'Horas que el estudiante/acudiente puede editar una excusa después de radicarla.'),
  ('email_dominio_personal', 'iedlavictoria.edu.co', 'Dominio de correo institucional del personal.'),
  ('email_dominio_estudiantes', 'estudiantes.iedlavictoria.edu.co', 'Dominio de correo institucional de estudiantes.');

INSERT INTO vigencia (id, fecha_inicio, fecha_fin) VALUES
  (2025, '2025-01-20', '2025-11-28'),
  (2026, '2026-01-19', '2026-11-27');

SELECT setval(pg_get_serial_sequence('vigencia', 'id'), 2026);

INSERT INTO curso (grado) VALUES
  ('6-01'), ('6-02'),
  ('7-01'), ('7-02'),
  ('8-01'),
  ('9-01'),
  ('10-01'), ('10-02'),
  ('11-01'), ('11-02');
