import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { parse } from 'csv-parse/sync';
import { neutralizeCsvCell } from '../common/csv-safe';
import { ROLE } from '../common/constants';
import { throwOnError } from '../common/supabase.util';
import { SupabaseService } from '../config/supabase.service';
import { UsuariosService } from './usuarios.service';

const MAX_CSV_ROWS = 200;

export interface CsvRowResult {
  line: number;
  ok: boolean;
  data: string;
  reason: string;
}

@Injectable()
export class CargaMasivaService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly usuarios: UsuariosService,
  ) {}

  async importar(buffer: Buffer) {
    let records: Record<string, string>[];
    try {
      records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch {
      throw new BadRequestException('El CSV no se pudo leer');
    }
    if (records.length > MAX_CSV_ROWS) {
      throw new BadRequestException(`El CSV no puede tener más de ${MAX_CSV_ROWS} filas`);
    }

    const idRol = await this.usuarios.findRolIdByNombre(ROLE.ESTUDIANTE);
    const resultados: CsvRowResult[] = [];

    for (const [index, row] of records.entries()) {
      const line = index + 2;
      const anio = neutralizeCsvCell(row.Año ?? row.anio ?? row.Ano ?? '');
      const idCursoLabel = neutralizeCsvCell(row.idCurso ?? row.curso ?? '');
      const usuario = neutralizeCsvCell(row.Usuario ?? row.usuario ?? '');
      const identificacion = neutralizeCsvCell(row['Identificación'] ?? row.identificacion ?? '');
      const apellidos = neutralizeCsvCell(row.Apellidos ?? row.apellidos ?? '');
      const nombres = neutralizeCsvCell(row.Nombres ?? row.nombres ?? '');
      const email = neutralizeCsvCell(row['E-Mail'] ?? row.email ?? row.Email ?? '');
      const snapshot = [anio, idCursoLabel, usuario, identificacion, apellidos, nombres, email]
        .filter(Boolean)
        .join(', ');

      try {
        if (!/^\d{6,20}$/.test(identificacion)) {
          throw new Error('La identificación debe tener entre 6 y 20 dígitos');
        }
        if (!email.includes('@')) throw new Error('El correo electrónico no tiene un formato válido');
        if (!usuario) throw new Error('El usuario es obligatorio');

        const vigencia = await this.supabase
          .from('vigencia')
          .select('id')
          .gte('fecha_inicio', `${anio}-01-01`)
          .lte('fecha_inicio', `${anio}-12-31`)
          .maybeSingle();
        throwOnError(vigencia.error);
        if (!vigencia.data) throw new Error(`El año ${anio} no está habilitado`);

        const curso = await this.supabase
          .from('curso')
          .select('id')
          .eq('grado', idCursoLabel)
          .maybeSingle();
        throwOnError(curso.error);
        if (!curso.data) throw new Error(`Curso ${idCursoLabel} no existe`);

        const contrasena = `Tmp.${randomBytes(9).toString('base64url')}!`;
        const created = await this.usuarios.create({
          identificacion,
          usuario,
          contrasena,
          nombre: nombres,
          apellido: apellidos,
          email,
          idRol,
        });

        const matricula = await this.supabase.from('usuario_curso_vigencia').insert({
          id_curso: (curso.data as { id: number }).id,
          id_vigencia: (vigencia.data as { id: number }).id,
          id_usuario: created.id,
        });
        throwOnError(matricula.error);

        resultados.push({
          line,
          ok: true,
          data: snapshot,
          reason: `Fila importada. Clave temporal: ${contrasena}`,
        });
      } catch (error) {
        resultados.push({
          line,
          ok: false,
          data: snapshot,
          reason: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return {
      procesadas: resultados.length,
      ok: resultados.filter((row) => row.ok).length,
      errores: resultados.filter((row) => !row.ok).length,
      filas: resultados,
    };
  }
}
