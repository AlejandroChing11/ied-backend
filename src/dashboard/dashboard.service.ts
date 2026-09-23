import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { ESTADO, ESTADO_PROCESO, ROLE } from '../common/constants';
import { throwOnError } from '../common/supabase.util';

@Injectable()
export class DashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  private async count(table: string, filters?: (q: any) => any) {
    let builder = this.supabase.from(table).select('id', { count: 'exact', head: true });
    if (filters) builder = filters(builder);
    const { count, error } = await builder;
    throwOnError(error);
    return count ?? 0;
  }

  async stats() {
    const [activo, radicada, enRevision] = await Promise.all([
      this.supabase.from('estado').select('id').eq('nombre', ESTADO.ACTIVO).maybeSingle(),
      this.supabase.from('estado_proceso').select('id').eq('nombre', ESTADO_PROCESO.RADICADA).maybeSingle(),
      this.supabase.from('estado_proceso').select('id').eq('nombre', ESTADO_PROCESO.EN_REVISION).maybeSingle(),
    ]);
    throwOnError(activo.error);
    throwOnError(radicada.error);
    throwOnError(enRevision.error);

    const idActivo = (activo.data as { id?: number } | null)?.id;
    const idRadicada = (radicada.data as { id?: number } | null)?.id;
    const idEnRevision = (enRevision.data as { id?: number } | null)?.id;

    const [usuariosActivos, excusasPendientes, convivenciaAbierta, matriculas] =
      await Promise.all([
        idActivo
          ? this.count('usuario', (q) => q.eq('id_estado', idActivo))
          : Promise.resolve(0),
        idRadicada
          ? this.count('excusa', (q) => q.eq('id_estado_proceso', idRadicada))
          : Promise.resolve(0),
        idEnRevision
          ? this.count('situacion_convivencia', (q) =>
              q.eq('id_estado_proceso', idEnRevision),
            )
          : Promise.resolve(0),
        this.count('usuario_curso_vigencia'),
      ]);

    return {
      usuariosActivos,
      excusasPendientes,
      convivenciaAbierta,
      matriculas,
      rolReferencia: ROLE.ADMINISTRADOR,
    };
  }
}
