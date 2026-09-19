import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { ESTADO_PROCESO } from '../common/constants';
import { AuthUser } from '../common/types';
import { paginateMeta, range, throwOnError } from '../common/supabase.util';
import { HistorialService } from '../historial/historial.service';
import { ArchivosService } from '../archivos/archivos.service';
import {
  AddReportanteDto,
  CreateActuacionDto,
  CreateRemisionDto,
  CreateSituacionDto,
  ListConvivenciaDto,
  UpdateActuacionDto,
} from './dto/convivencia.dto';

const SELECT = `
  id, id_estudiante, fecha_hora, lugar, descripcion_objetiva, id_clasificacion,
  id_estado_proceso, fecha_creacion, id_usuario_creo,
  estudiante:usuario!situacion_convivencia_id_estudiante_fkey ( id, nombre, apellido, identificacion ),
  creador:usuario!situacion_convivencia_id_usuario_creo_fkey ( id, nombre, apellido ),
  clasificacion:clasificacion_convivencia ( id, nombre, descripcion ),
  estado_proceso:estado_proceso ( id, nombre )
`;

@Injectable()
export class ConvivenciaService {
  constructor(
    private readonly supabase: SupabaseService,
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
    if (!data) throw new NotFoundException(`Estado ${nombre} no encontrado`);
    return (data as { id: number }).id;
  }

  async list(query: ListConvivenciaDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [from, to] = range(page, limit);
    let builder = this.supabase
      .from('situacion_convivencia')
      .select(SELECT, { count: 'exact' })
      .order('fecha_creacion', { ascending: false })
      .range(from, to);
    if (query.idEstudiante) builder = builder.eq('id_estudiante', query.idEstudiante);
    if (query.idClasificacion) builder = builder.eq('id_clasificacion', query.idClasificacion);
    if (query.idEstadoProceso) builder = builder.eq('id_estado_proceso', query.idEstadoProceso);
    const { data, error, count } = await builder;
    throwOnError(error);
    return { data: data ?? [], meta: paginateMeta(page, limit, count ?? 0) };
  }

  async findOne(id: number, user: AuthUser) {
    const { data, error } = await this.supabase
      .from('situacion_convivencia')
      .select(SELECT)
      .eq('id', id)
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Situación no encontrada');

    const [reportantes, actuaciones, remisiones, historial, archivos] = await Promise.all([
      this.supabase
        .from('situacion_reportante')
        .select(
          'id, id_usuario_reporta, rol_en_reporte, usuario:usuario ( id, nombre, apellido )',
        )
        .eq('id_situacion', id),
      this.supabase
        .from('actuacion_convivencia')
        .select(
          `id, descripcion, id_responsable, fecha_compromiso, fecha_cumplimiento, cumplido,
           responsable:usuario!actuacion_convivencia_id_responsable_fkey ( id, nombre, apellido )`,
        )
        .eq('id_situacion', id)
        .order('fecha_registro'),
      this.supabase
        .from('remision_orientacion')
        .select('*')
        .eq('id_situacion', id),
      this.historial.listar('SITUACION_CONVIVENCIA', id),
      this.archivos.listByEntidad('SITUACION_CONVIVENCIA', id, user),
    ]);
    throwOnError(reportantes.error);
    throwOnError(actuaciones.error);
    throwOnError(remisiones.error);

    const row = data as any;
    return {
      ...row,
      alertaTipoIII: row.clasificacion?.nombre === 'Tipo III',
      reportantes: reportantes.data ?? [],
      actuaciones: actuaciones.data ?? [],
      remisiones: remisiones.data ?? [],
      historial,
      archivos,
    };
  }

  async create(dto: CreateSituacionDto, user: AuthUser) {
    const idEstado = await this.estadoId(ESTADO_PROCESO.RADICADA);
    const { data, error } = await this.supabase
      .from('situacion_convivencia')
      .insert({
        id_estudiante: dto.idEstudiante,
        fecha_hora: dto.fechaHora,
        lugar: dto.lugar ?? null,
        descripcion_objetiva: dto.descripcionObjetiva,
        id_clasificacion: dto.idClasificacion,
        id_estado_proceso: idEstado,
        id_usuario_creo: user.id,
      })
      .select(SELECT)
      .single();
    throwOnError(error);
    const created = data as any;
    await this.supabase.from('situacion_reportante').insert({
      id_situacion: created.id,
      id_usuario_reporta: user.id,
      rol_en_reporte: dto.rolEnReporte ?? user.rol,
    });
    await this.historial.registrar({
      entidadTipo: 'SITUACION_CONVIVENCIA',
      entidadId: created.id,
      idUsuario: user.id,
      accion: 'RADICACION',
      observacion: created.clasificacion?.nombre,
    });
    return this.findOne(created.id, user);
  }

  async addReportante(id: number, dto: AddReportanteDto, user: AuthUser) {
    await this.findOne(id, user);
    const { data, error } = await this.supabase
      .from('situacion_reportante')
      .insert({
        id_situacion: id,
        id_usuario_reporta: dto.idUsuarioReporta,
        rol_en_reporte: dto.rolEnReporte ?? null,
      })
      .select()
      .single();
    throwOnError(error);
    return data;
  }

  async addActuacion(id: number, dto: CreateActuacionDto, user: AuthUser) {
    await this.findOne(id, user);
    const { data, error } = await this.supabase
      .from('actuacion_convivencia')
      .insert({
        id_situacion: id,
        descripcion: dto.descripcion,
        id_responsable: dto.idResponsable,
        fecha_compromiso: dto.fechaCompromiso ?? null,
        id_usuario_registro: user.id,
      })
      .select()
      .single();
    throwOnError(error);
    await this.historial.registrar({
      entidadTipo: 'SITUACION_CONVIVENCIA',
      entidadId: id,
      idUsuario: user.id,
      accion: 'COMPROMISO',
      observacion: dto.descripcion,
    });
    const enRevision = await this.estadoId(ESTADO_PROCESO.EN_REVISION);
    await this.supabase
      .from('situacion_convivencia')
      .update({ id_estado_proceso: enRevision })
      .eq('id', id);
    return data;
  }

  async updateActuacion(id: number, aid: number, dto: UpdateActuacionDto, user: AuthUser) {
    const patch: Record<string, unknown> = {};
    if (dto.cumplido !== undefined) patch.cumplido = dto.cumplido;
    if (dto.fechaCumplimiento) patch.fecha_cumplimiento = dto.fechaCumplimiento;
    if (dto.cumplido && !dto.fechaCumplimiento) {
      patch.fecha_cumplimiento = new Date().toISOString().slice(0, 10);
    }
    const { data, error } = await this.supabase
      .from('actuacion_convivencia')
      .update(patch)
      .eq('id', aid)
      .eq('id_situacion', id)
      .select()
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Actuación no encontrada');
    await this.historial.registrar({
      entidadTipo: 'SITUACION_CONVIVENCIA',
      entidadId: id,
      idUsuario: user.id,
      accion: 'CAMBIO_ESTADO',
      observacion: dto.cumplido ? 'Compromiso cumplido' : 'Actuación actualizada',
    });
    return data;
  }

  private async nextRemision() {
    const year = new Date().getFullYear();
    const prefix = `REM-${year}-`;
    const { data, error } = await this.supabase
      .from('remision_orientacion')
      .select('numero_remision')
      .like('numero_remision', `${prefix}%`)
      .order('numero_remision', { ascending: false })
      .limit(1);
    throwOnError(error);
    const last = (data?.[0] as { numero_remision?: string } | undefined)?.numero_remision;
    const seq = last ? Number(last.split('-')[2]) + 1 : 1;
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  async createRemision(id: number, dto: CreateRemisionDto, user: AuthUser) {
    const situacion = await this.findOne(id, user);
    const numero = await this.nextRemision();
    const contenido = [
      `Remisión de orientación ${numero}`,
      `Estudiante: ${situacion.estudiante?.nombre ?? ''} ${situacion.estudiante?.apellido ?? ''}`,
      `Hechos: ${situacion.descripcion_objetiva}`,
      `Motivo de atención: ${dto.motivoAtencion}`,
      'Este documento no contiene diagnósticos.',
    ].join('\n');

    const path = `${id}/${numero}.txt`;
    await this.supabase.admin.storage.from('convivencia').upload(path, contenido, {
      contentType: 'text/plain',
      upsert: true,
    });

    const { data, error } = await this.supabase
      .from('remision_orientacion')
      .insert({
        id_situacion: id,
        numero_remision: numero,
        motivo_atencion: dto.motivoAtencion,
        activada: false,
        fecha_generacion: new Date().toISOString(),
        ruta_pdf: `convivencia/${path}`,
        id_usuario_genera: user.id,
      })
      .select()
      .single();
    throwOnError(error);
    await this.historial.registrar({
      entidadTipo: 'SITUACION_CONVIVENCIA',
      entidadId: id,
      idUsuario: user.id,
      accion: 'REMISION',
      observacion: numero,
    });
    return data;
  }

  async activarRemision(id: number, rid: number, user: AuthUser) {
    const { data, error } = await this.supabase
      .from('remision_orientacion')
      .update({
        activada: true,
        fecha_activacion: new Date().toISOString(),
      })
      .eq('id', rid)
      .eq('id_situacion', id)
      .select()
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Remisión no encontrada');
    if (!(data as any).motivo_atencion) {
      throw new BadRequestException('La remisión no tiene motivo de atención');
    }
    await this.historial.registrar({
      entidadTipo: 'SITUACION_CONVIVENCIA',
      entidadId: id,
      idUsuario: user.id,
      accion: 'REMISION',
      observacion: 'Remisión activada',
    });
    return data;
  }

  async listClasificaciones() {
    const { data, error } = await this.supabase
      .from('clasificacion_convivencia')
      .select('*')
      .order('id');
    throwOnError(error);
    return data ?? [];
  }
}
