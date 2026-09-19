import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { ROLE } from '../common/constants';
import { paginateMeta, range, throwOnError } from '../common/supabase.util';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CreateAsignacionDto, ListAsignacionesDto } from './dto/asignacion.dto';

const SELECT = `
  id, id_curso, id_vigencia, id_usuario,
  curso:curso ( id, grado ),
  vigencia:vigencia ( id, fecha_inicio, fecha_fin ),
  usuario:usuario ( id, nombre, apellido, email, identificacion, usuario, id_rol, rol:rol ( nombre ) )
`;

@Injectable()
export class AsignacionesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly usuarios: UsuariosService,
  ) {}

  async list(query: ListAsignacionesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [from, to] = range(page, limit);
    let builder = this.supabase
      .from('usuario_curso_vigencia')
      .select(SELECT, { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, to);
    if (query.idCurso) builder = builder.eq('id_curso', query.idCurso);
    if (query.idVigencia) builder = builder.eq('id_vigencia', query.idVigencia);
    if (query.idUsuario) builder = builder.eq('id_usuario', query.idUsuario);

    const { data, error, count } = await builder;
    throwOnError(error);
    const rows = ((data ?? []) as any[]).filter(
      (row) => row.usuario?.rol?.nombre === ROLE.DOCENTE,
    );
    return { data: rows, meta: paginateMeta(page, limit, count ?? rows.length) };
  }

  async create(dto: CreateAsignacionDto) {
    const user = await this.usuarios.findById(dto.idUsuario);
    if (user.rol?.nombre !== ROLE.DOCENTE) {
      throw new BadRequestException('Solo se puede asignar a un docente');
    }
    const { data, error } = await this.supabase
      .from('usuario_curso_vigencia')
      .insert({
        id_curso: dto.idCurso,
        id_vigencia: dto.idVigencia,
        id_usuario: dto.idUsuario,
      })
      .select(SELECT)
      .single();
    throwOnError(error);
    return data;
  }

  async remove(id: number) {
    const existing = await this.supabase
      .from('usuario_curso_vigencia')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    throwOnError(existing.error);
    if (!existing.data) throw new NotFoundException('Asignación no encontrada');
    const { error } = await this.supabase.from('usuario_curso_vigencia').delete().eq('id', id);
    throwOnError(error);
    return { deleted: true };
  }

  async misCursos(idUsuario: number) {
    const { data, error } = await this.supabase
      .from('usuario_curso_vigencia')
      .select(
        `id, id_curso, id_vigencia,
         curso:curso ( id, grado ),
         vigencia:vigencia ( id, fecha_inicio, fecha_fin )`,
      )
      .eq('id_usuario', idUsuario)
      .order('id');
    throwOnError(error);
    const cursos = data ?? [];
    const result: Array<Record<string, unknown>> = [];
    for (const row of cursos as any[]) {
      const estudiantes = await this.supabase
        .from('usuario_curso_vigencia')
        .select(
          `id, usuario:usuario ( id, nombre, apellido, identificacion, email, rol:rol ( nombre ) )`,
        )
        .eq('id_curso', row.id_curso)
        .eq('id_vigencia', row.id_vigencia);
      throwOnError(estudiantes.error);
      result.push({
        ...row,
        estudiantes: ((estudiantes.data ?? []) as any[]).filter(
          (item) => item.usuario?.rol?.nombre === ROLE.ESTUDIANTE,
        ),
      });
    }
    return result;
  }
}
