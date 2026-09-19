import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { throwOnError } from '../common/supabase.util';
import { UpdateConfiguracionDto } from './dto/configuracion.dto';

@Injectable()
export class ConfiguracionService {
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const { data, error } = await this.supabase
      .from('configuracion')
      .select('id, clave, valor, descripcion')
      .order('id');
    throwOnError(error);
    return data ?? [];
  }

  async getValor(clave: string, fallback: string) {
    const { data, error } = await this.supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', clave)
      .maybeSingle();
    throwOnError(error);
    return (data as { valor?: string } | null)?.valor ?? fallback;
  }

  async update(id: number, dto: UpdateConfiguracionDto) {
    const { data, error } = await this.supabase
      .from('configuracion')
      .update({ valor: dto.valor })
      .eq('id', id)
      .select('id, clave, valor, descripcion')
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Configuración no encontrada');
    return data;
  }
}
