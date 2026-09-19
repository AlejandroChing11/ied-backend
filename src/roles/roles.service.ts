import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { throwOnError } from '../common/supabase.util';
import { UpdateRolPermisosDto } from './dto/update-permisos.dto';

@Injectable()
export class RolesService {
  constructor(private readonly supabase: SupabaseService) {}

  async listRoles() {
    const { data, error } = await this.supabase
      .from('rol')
      .select(
        `id, nombre, descripcion,
         rol_permiso ( permiso:permiso ( id, codigo, nombre, descripcion ) )`,
      )
      .order('id');
    throwOnError(error);
    return (data ?? []).map((rol: any) => ({
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: (rol.rol_permiso ?? []).map((item: any) => item.permiso).filter(Boolean),
    }));
  }

  async findRol(id: number) {
    const { data, error } = await this.supabase
      .from('rol')
      .select(
        `id, nombre, descripcion,
         rol_permiso ( permiso:permiso ( id, codigo, nombre, descripcion ) )`,
      )
      .eq('id', id)
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Rol no encontrado');
    const rol = data as any;
    return {
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: (rol.rol_permiso ?? []).map((item: any) => item.permiso).filter(Boolean),
    };
  }

  async listPermisos() {
    const { data, error } = await this.supabase
      .from('permiso')
      .select('id, codigo, nombre, descripcion')
      .order('id');
    throwOnError(error);
    return data ?? [];
  }

  async updatePermisos(id: number, dto: UpdateRolPermisosDto) {
    await this.findRol(id);
    const del = await this.supabase.from('rol_permiso').delete().eq('id_rol', id);
    throwOnError(del.error);
    if (dto.permisoIds.length > 0) {
      const ins = await this.supabase.from('rol_permiso').insert(
        dto.permisoIds.map((idPermiso) => ({ id_rol: id, id_permiso: idPermiso })),
      );
      throwOnError(ins.error);
    }
    return this.findRol(id);
  }
}
