import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { ROLE } from '../common/constants';
import { paginateMeta, range, throwOnError } from '../common/supabase.util';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CreateVinculoDto, ListVinculosDto, UpdateVinculoDto } from './dto/vinculo.dto';

const SELECT = `
  id, id_acudiente, id_estudiante, parentesco, es_principal,
  acudiente:usuario!acudiente_estudiante_id_acudiente_fkey ( id, nombre, apellido, email, identificacion ),
  estudiante:usuario!acudiente_estudiante_id_estudiante_fkey ( id, nombre, apellido, email, identificacion )
`;

@Injectable()
export class VinculosService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly usuarios: UsuariosService,
  ) {}

  async list(query: ListVinculosDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [from, to] = range(page, limit);
    let builder = this.supabase
      .from('acudiente_estudiante')
      .select(SELECT, { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, to);
    if (query.idAcudiente) builder = builder.eq('id_acudiente', query.idAcudiente);
    if (query.idEstudiante) builder = builder.eq('id_estudiante', query.idEstudiante);
    const { data, error, count } = await builder;
    throwOnError(error);
    return { data: data ?? [], meta: paginateMeta(page, limit, count ?? 0) };
  }

  async create(dto: CreateVinculoDto) {
    const acudiente = await this.usuarios.findById(dto.idAcudiente);
    const estudiante = await this.usuarios.findById(dto.idEstudiante);
    if (acudiente.rol?.nombre !== ROLE.ACUDIENTE) {
      throw new BadRequestException('idAcudiente debe tener rol ACUDIENTE');
    }
    if (estudiante.rol?.nombre !== ROLE.ESTUDIANTE) {
      throw new BadRequestException('idEstudiante debe tener rol ESTUDIANTE');
    }
    const { data, error } = await this.supabase
      .from('acudiente_estudiante')
      .insert({
        id_acudiente: dto.idAcudiente,
        id_estudiante: dto.idEstudiante,
        parentesco: dto.parentesco ?? null,
        es_principal: dto.esPrincipal ?? true,
      })
      .select(SELECT)
      .single();
    throwOnError(error);
    return data;
  }

  async update(id: number, dto: UpdateVinculoDto) {
    const patch: Record<string, unknown> = {};
    if (dto.parentesco !== undefined) patch.parentesco = dto.parentesco;
    if (dto.esPrincipal !== undefined) patch.es_principal = dto.esPrincipal;
    const { data, error } = await this.supabase
      .from('acudiente_estudiante')
      .update(patch)
      .eq('id', id)
      .select(SELECT)
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Vínculo no encontrado');
    return data;
  }

  async remove(id: number) {
    const existing = await this.supabase
      .from('acudiente_estudiante')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    throwOnError(existing.error);
    if (!existing.data) throw new NotFoundException('Vínculo no encontrado');
    const { error } = await this.supabase.from('acudiente_estudiante').delete().eq('id', id);
    throwOnError(error);
    return { deleted: true };
  }

  async acudidos(idAcudiente: number) {
    const { data, error } = await this.supabase
      .from('acudiente_estudiante')
      .select(SELECT)
      .eq('id_acudiente', idAcudiente)
      .order('id');
    throwOnError(error);
    const vinculos = (data ?? []) as any[];
    const result: Array<Record<string, unknown>> = [];
    for (const vinculo of vinculos) {
      const excusas = await this.supabase
        .from('excusa')
        .select(
          'id, radicado, fecha_inicio, fecha_fin, motivo_descripcion, id_estado_proceso, estado_proceso:estado_proceso ( nombre )',
        )
        .eq('id_estudiante', vinculo.id_estudiante)
        .order('fecha_radicado', { ascending: false });
      throwOnError(excusas.error);
      result.push({ ...vinculo, excusas: excusas.data ?? [] });
    }
    return result;
  }
}
