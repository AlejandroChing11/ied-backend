import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { throwOnError } from '../common/supabase.util';
import {
  CreateCursoDto,
  CreateVigenciaDto,
  ListCursosDto,
  ListVigenciasDto,
  UpdateCursoDto,
  UpdateVigenciaDto,
} from './dto/academico.dto';

@Injectable()
export class AcademicoService {
  constructor(private readonly supabase: SupabaseService) {}

  async listCursos(query: ListCursosDto) {
    let builder = this.supabase.from('curso').select('id, grado').order('grado');
    if (query.grado) builder = builder.ilike('grado', `${query.grado}%`);
    const { data, error } = await builder;
    throwOnError(error);
    return data ?? [];
  }

  async createCurso(dto: CreateCursoDto) {
    const payload: Record<string, unknown> = { grado: dto.grado };
    if (dto.id) payload.id = dto.id;
    const { data, error } = await this.supabase
      .from('curso')
      .insert(payload)
      .select('id, grado')
      .single();
    throwOnError(error);
    return data;
  }

  async updateCurso(id: number, dto: UpdateCursoDto) {
    const { data, error } = await this.supabase
      .from('curso')
      .update({ grado: dto.grado })
      .eq('id', id)
      .select('id, grado')
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Curso no encontrado');
    return data;
  }

  async listVigencias(query: ListVigenciasDto) {
    let builder = this.supabase
      .from('vigencia')
      .select('id, fecha_inicio, fecha_fin')
      .order('fecha_inicio', { ascending: false });
    if (query.anio) {
      builder = builder
        .gte('fecha_inicio', `${query.anio}-01-01`)
        .lte('fecha_inicio', `${query.anio}-12-31`);
    }
    const { data, error } = await builder;
    throwOnError(error);
    return (data ?? []).map((row: any) => ({
      id: row.id,
      fechaInicio: row.fecha_inicio,
      fechaFin: row.fecha_fin,
      anio: String(row.fecha_inicio).slice(0, 4),
    }));
  }

  async createVigencia(dto: CreateVigenciaDto) {
    if (dto.fechaFin <= dto.fechaInicio) {
      throw new BadRequestException('fechaFin debe ser posterior a fechaInicio');
    }
    const payload: Record<string, unknown> = {
      fecha_inicio: dto.fechaInicio,
      fecha_fin: dto.fechaFin,
    };
    if (dto.id) payload.id = dto.id;
    const { data, error } = await this.supabase
      .from('vigencia')
      .insert(payload)
      .select('id, fecha_inicio, fecha_fin')
      .single();
    throwOnError(error);
    return data;
  }

  async updateVigencia(id: number, dto: UpdateVigenciaDto) {
    const current = await this.supabase
      .from('vigencia')
      .select('id, fecha_inicio, fecha_fin')
      .eq('id', id)
      .maybeSingle();
    throwOnError(current.error);
    if (!current.data) throw new NotFoundException('Vigencia no encontrada');

    const fechaInicio = dto.fechaInicio ?? (current.data as any).fecha_inicio;
    const fechaFin = dto.fechaFin ?? (current.data as any).fecha_fin;
    if (fechaFin <= fechaInicio) {
      throw new BadRequestException('fechaFin debe ser posterior a fechaInicio');
    }

    const { data, error } = await this.supabase
      .from('vigencia')
      .update({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      .eq('id', id)
      .select('id, fecha_inicio, fecha_fin')
      .single();
    throwOnError(error);
    return data;
  }
}
