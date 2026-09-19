import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { throwOnError } from '../common/supabase.util';

@Injectable()
export class HistorialService {
  constructor(private readonly supabase: SupabaseService) {}

  async registrar(input: {
    entidadTipo: string;
    entidadId: number;
    idUsuario: number;
    accion: string;
    observacion?: string | null;
  }) {
    const { error } = await this.supabase.from('historial_proceso').insert({
      entidad_tipo: input.entidadTipo,
      entidad_id: input.entidadId,
      id_usuario_actua: input.idUsuario,
      accion: input.accion,
      observacion: input.observacion ?? null,
    });
    throwOnError(error);
  }

  async listar(entidadTipo: string, entidadId: number) {
    const { data, error } = await this.supabase
      .from('historial_proceso')
      .select(
        `id, entidad_tipo, entidad_id, accion, observacion, fecha_hora,
         usuario:usuario!historial_proceso_id_usuario_actua_fkey ( id, nombre, apellido )`,
      )
      .eq('entidad_tipo', entidadTipo)
      .eq('entidad_id', entidadId)
      .order('fecha_hora', { ascending: true });
    throwOnError(error);
    return data ?? [];
  }
}
