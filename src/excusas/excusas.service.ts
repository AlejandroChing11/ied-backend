import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { ESTADO_PROCESO, PERMISSION, ROLE } from '../common/constants';
import { AuthUser, hasPermission } from '../common/types';
import { paginateMeta, range, throwOnError } from '../common/supabase.util';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { HistorialService } from '../historial/historial.service';
import { ArchivosService } from '../archivos/archivos.service';
import {
  CreateExcusaDto,
  ListExcusasDto,
  ResolverExcusaDto,
  UpdateExcusaDto,
} from './dto/excusa.dto';

const SELECT = `
  id, radicado, id_estudiante, id_usuario_radica, fecha_inicio, fecha_fin,
  motivo_descripcion, fecha_radicado, fecha_limite_edicion, id_estado_proceso,
  id_motivo_resolucion, observaciones_revision, id_usuario_reviso, fecha_revision,
  estudiante:usuario!excusa_id_estudiante_fkey ( id, nombre, apellido, identificacion ),
  radicador:usuario!excusa_id_usuario_radica_fkey ( id, nombre, apellido ),
  revisor:usuario!excusa_id_usuario_reviso_fkey ( id, nombre, apellido ),
  estado_proceso:estado_proceso ( id, nombre ),
  motivo_resolucion:motivo_resolucion ( id, nombre )
`;

@Injectable()
export class ExcusasService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly configuracion: ConfiguracionService,
    private readonly historial: HistorialService,
    private readonly archivos: ArchivosService,
  ) {}

  private async estadoId(nombre: string) {
    const { data, error } = await this.supabase
      .from('estado_proceso')
      .select('id')
      .eq('nombre', nombre)
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException(`Estado de proceso ${nombre} no encontrado`);
    return (data as { id: number }).id;
  }

  private async assertPuedeRadicar(user: AuthUser, idEstudiante: number) {
    if (user.rol === ROLE.ADMINISTRADOR) return;
    if (user.rol === ROLE.ESTUDIANTE) {
      if (user.id !== idEstudiante) {
        throw new ForbiddenException('Solo puede radicar sus propias excusas');
      }
      return;
    }
    if (user.rol === ROLE.ACUDIENTE) {
      const { data, error } = await this.supabase
        .from('acudiente_estudiante')
        .select('id')
        .eq('id_acudiente', user.id)
        .eq('id_estudiante', idEstudiante)
        .maybeSingle();
      throwOnError(error);
      if (!data) throw new ForbiddenException('No está vinculado a ese estudiante');
      return;
    }
    throw new ForbiddenException('No puede radicar excusas');
  }

  private async assertPuedeVer(idEstudiante: number, user: AuthUser) {
    if (user.rol === ROLE.ADMINISTRADOR) return;
    if (hasPermission(user, PERMISSION.EXCUSA_VER) && user.rol !== ROLE.ACUDIENTE && user.rol !== ROLE.ESTUDIANTE) {
      return;
    }
    if (user.rol === ROLE.ESTUDIANTE) {
      if (user.id !== idEstudiante) {
        throw new ForbiddenException('No puede ver esta excusa');
      }
      return;
    }
    if (user.rol === ROLE.ACUDIENTE) {
      const { data, error } = await this.supabase
        .from('acudiente_estudiante')
        .select('id')
        .eq('id_acudiente', user.id)
        .eq('id_estudiante', idEstudiante)
        .maybeSingle();
      throwOnError(error);
      if (!data) throw new ForbiddenException('No puede ver esta excusa');
      return;
    }
    if (!hasPermission(user, PERMISSION.EXCUSA_VER)) {
      throw new ForbiddenException('No puede ver esta excusa');
    }
  }

  private async nextRadicado() {
    const year = new Date().getFullYear();
    const prefix = `EXC-${year}-`;
    const { data, error } = await this.supabase
      .from('excusa')
      .select('radicado')
      .like('radicado', `${prefix}%`)
      .order('radicado', { ascending: false })
      .limit(1);
    throwOnError(error);
    const last = (data?.[0] as { radicado?: string } | undefined)?.radicado;
    const seq = last ? Number(last.split('-')[2]) + 1 : 1;
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  async list(query: ListExcusasDto, user: AuthUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [from, to] = range(page, limit);
    let builder = this.supabase
      .from('excusa')
      .select(SELECT, { count: 'exact' })
      .order('fecha_radicado', { ascending: false })
      .range(from, to);

    if (user.rol === ROLE.ESTUDIANTE) builder = builder.eq('id_estudiante', user.id);
    if (user.rol === ROLE.ACUDIENTE) {
      const { data, error } = await this.supabase
        .from('acudiente_estudiante')
        .select('id_estudiante')
        .eq('id_acudiente', user.id);
      throwOnError(error);
      const ids = ((data ?? []) as { id_estudiante: number }[]).map((row) => row.id_estudiante);
      builder = builder.in('id_estudiante', ids.length ? ids : [0]);
    }
    if (query.idEstudiante) builder = builder.eq('id_estudiante', query.idEstudiante);
    if (query.idEstadoProceso) builder = builder.eq('id_estado_proceso', query.idEstadoProceso);
    if (query.desde) builder = builder.gte('fecha_inicio', query.desde);
    if (query.hasta) builder = builder.lte('fecha_fin', query.hasta);

    const { data, error, count } = await builder;
    throwOnError(error);
    return { data: data ?? [], meta: paginateMeta(page, limit, count ?? 0) };
  }

  async findOne(id: number, user: AuthUser) {
    const { data, error } = await this.supabase
      .from('excusa')
      .select(SELECT)
      .eq('id', id)
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Excusa no encontrada');
    const row = data as any;
    await this.assertPuedeVer(row.id_estudiante, user);
    const historial = await this.historial.listar('EXCUSA', id);
    const archivos = await this.archivos.listByEntidad('EXCUSA', id, user);
    return { ...row, historial, archivos };
  }

  async create(dto: CreateExcusaDto, user: AuthUser) {
    if (dto.fechaFin < dto.fechaInicio) {
      throw new BadRequestException('fechaFin debe ser posterior o igual a fechaInicio');
    }
    await this.assertPuedeRadicar(user, dto.idEstudiante);
    const horas = Number(await this.configuracion.getValor('plazo_edicion_excusa', '1'));
    const ahora = new Date();
    const limite = new Date(ahora.getTime() + horas * 60 * 60 * 1000);
    const radicado = await this.nextRadicado();
    const idEstado = await this.estadoId(ESTADO_PROCESO.RADICADA);

    const { data, error } = await this.supabase
      .from('excusa')
      .insert({
        radicado,
        id_estudiante: dto.idEstudiante,
        id_usuario_radica: user.id,
        fecha_inicio: dto.fechaInicio,
        fecha_fin: dto.fechaFin,
        motivo_descripcion: dto.motivoDescripcion,
        fecha_limite_edicion: limite.toISOString(),
        id_estado_proceso: idEstado,
      })
      .select(SELECT)
      .single();
    throwOnError(error);
    const created = data as any;
    await this.historial.registrar({
      entidadTipo: 'EXCUSA',
      entidadId: created.id,
      idUsuario: user.id,
      accion: 'RADICACION',
      observacion: radicado,
    });
    return created;
  }

  async update(id: number, dto: UpdateExcusaDto, user: AuthUser) {
    const current = await this.findOne(id, user);
    const estado = current.estado_proceso?.nombre;
    if (estado !== ESTADO_PROCESO.RADICADA) {
      throw new BadRequestException('Solo se puede editar una excusa radicada');
    }
    if (new Date() > new Date(current.fecha_limite_edicion)) {
      throw new ForbiddenException('El plazo de edición ya venció');
    }
    if (user.rol === ROLE.ESTUDIANTE && current.id_estudiante !== user.id) {
      throw new ForbiddenException('No puede editar esta excusa');
    }
    const patch: Record<string, unknown> = {};
    if (dto.fechaInicio) patch.fecha_inicio = dto.fechaInicio;
    if (dto.fechaFin) patch.fecha_fin = dto.fechaFin;
    if (dto.motivoDescripcion) patch.motivo_descripcion = dto.motivoDescripcion;
    const { data, error } = await this.supabase
      .from('excusa')
      .update(patch)
      .eq('id', id)
      .select(SELECT)
      .single();
    throwOnError(error);
    await this.historial.registrar({
      entidadTipo: 'EXCUSA',
      entidadId: id,
      idUsuario: user.id,
      accion: 'EDICION',
      observacion: 'Actualización dentro del plazo',
    });
    return data;
  }

  async resolver(id: number, dto: ResolverExcusaDto, user: AuthUser) {
    if (!hasPermission(user, PERMISSION.EXCUSA_RESOLVER)) {
      throw new ForbiddenException('No puede resolver excusas');
    }
    if (dto.decision !== ESTADO_PROCESO.APROBADA && dto.decision !== ESTADO_PROCESO.RECHAZADA) {
      throw new BadRequestException('La decisión debe ser Aprobada o Rechazada');
    }
    const idEstado = await this.estadoId(dto.decision);
    const { data, error } = await this.supabase
      .from('excusa')
      .update({
        id_estado_proceso: idEstado,
        id_motivo_resolucion: dto.idMotivoResolucion,
        observaciones_revision: dto.observacionesRevision,
        id_usuario_reviso: user.id,
        fecha_revision: new Date().toISOString(),
      })
      .eq('id', id)
      .select(SELECT)
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Excusa no encontrada');
    await this.historial.registrar({
      entidadTipo: 'EXCUSA',
      entidadId: id,
      idUsuario: user.id,
      accion: 'REVISION',
      observacion: `${dto.decision}: ${dto.observacionesRevision}`,
    });
    return data;
  }
}
