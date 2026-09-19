import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { paginateMeta, range, throwOnError, unwrapList } from '../common/supabase.util';

export interface RegistrarAuditoriaInput {
  idUsuario: number;
  accion: string;
  entidad: string;
  idEntidad?: number | null;
  detalle?: string | null;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly supabase: SupabaseService) {}

  async registrar(input: RegistrarAuditoriaInput) {
    const { error } = await this.supabase.from('auditoria').insert({
      id_usuario: input.idUsuario,
      accion: input.accion,
      entidad: input.entidad,
      id_entidad: input.idEntidad ?? null,
      detalle: input.detalle ?? null,
    });
    throwOnError(error);
  }

  async list(params: {
    page: number;
    limit: number;
    idUsuario?: number;
    entidad?: string;
    desde?: string;
    hasta?: string;
  }) {
    const [from, to] = range(params.page, params.limit);
    let builder = this.supabase
      .from('auditoria')
      .select(
        `id, id_usuario, accion, entidad, id_entidad, fecha_hora, detalle,
         usuario:usuario ( id, nombre, apellido, usuario )`,
        { count: 'exact' },
      )
      .order('fecha_hora', { ascending: false })
      .range(from, to);

    if (params.idUsuario) builder = builder.eq('id_usuario', params.idUsuario);
    if (params.entidad) builder = builder.eq('entidad', params.entidad);
    if (params.desde) builder = builder.gte('fecha_hora', params.desde);
    if (params.hasta) builder = builder.lte('fecha_hora', params.hasta);

    const { data, error, count } = await builder;
    throwOnError(error);
    return {
      data: unwrapList({ data, error: null }),
      meta: paginateMeta(params.page, params.limit, count ?? 0),
    };
  }
}
