import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';
import { ESTADO, ROLE } from '../common/constants';
import { paginateMeta, range, throwOnError, unwrap } from '../common/supabase.util';
import { CreateUsuarioDto, ListUsuariosDto, UpdateUsuarioDto } from './dto/usuario.dto';
import {
  toAuthUser,
  toUsuarioDto,
  USUARIO_SELECT,
  UsuarioRow,
} from './usuario.mapper';

@Injectable()
export class UsuariosService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(query: ListUsuariosDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [from, to] = range(page, limit);

    let builder = this.supabase
      .from('usuario')
      .select(USUARIO_SELECT, { count: 'exact' })
      .order('id', { ascending: true })
      .range(from, to);

    if (query.idRol) builder = builder.eq('id_rol', query.idRol);
    if (query.idEstado) builder = builder.eq('id_estado', query.idEstado);
    if (query.q?.trim()) {
      const q = `%${query.q.trim()}%`;
      builder = builder.or(
        `nombre.ilike.${q},apellido.ilike.${q},email.ilike.${q},identificacion.ilike.${q},usuario.ilike.${q}`,
      );
    }

    const { data, error, count } = await builder;
    throwOnError(error);
    return {
      data: ((data ?? []) as unknown as UsuarioRow[]).map(toUsuarioDto),
      meta: paginateMeta(page, limit, count ?? 0),
    };
  }

  async findRowById(id: number): Promise<UsuarioRow> {
    const result = await this.supabase
      .from('usuario')
      .select(USUARIO_SELECT)
      .eq('id', id)
      .maybeSingle();
    throwOnError(result.error);
    if (!result.data) throw new NotFoundException('Usuario no encontrado');
    return result.data as unknown as UsuarioRow;
  }

  async findById(id: number) {
    return toUsuarioDto(await this.findRowById(id));
  }

  async findRowByAuthId(authId: string): Promise<UsuarioRow | null> {
    const result = await this.supabase
      .from('usuario')
      .select(USUARIO_SELECT)
      .eq('auth_id', authId)
      .maybeSingle();
    throwOnError(result.error);
    return (result.data as unknown as UsuarioRow) ?? null;
  }

  async findRowByUsuarioOrEmail(value: string): Promise<UsuarioRow | null> {
    const result = await this.supabase
      .from('usuario')
      .select(USUARIO_SELECT)
      .or(`usuario.eq.${value},email.eq.${value}`)
      .maybeSingle();
    throwOnError(result.error);
    return (result.data as unknown as UsuarioRow) ?? null;
  }

  async countAll() {
    const { count, error } = await this.supabase
      .from('usuario')
      .select('id', { count: 'exact', head: true });
    throwOnError(error);
    return count ?? 0;
  }

  async findEstadoIdByNombre(nombre: string) {
    const result = await this.supabase
      .from('estado')
      .select('id')
      .eq('nombre', nombre)
      .maybeSingle();
    throwOnError(result.error);
    if (!result.data) throw new NotFoundException(`Estado ${nombre} no encontrado`);
    return (result.data as { id: number }).id;
  }

  async findRolIdByNombre(nombre: string) {
    const result = await this.supabase
      .from('rol')
      .select('id')
      .eq('nombre', nombre)
      .maybeSingle();
    throwOnError(result.error);
    if (!result.data) throw new NotFoundException(`Rol ${nombre} no encontrado`);
    return (result.data as { id: number }).id;
  }

  async assertRolNombre(idRol: number, expected: string) {
    const result = await this.supabase
      .from('rol')
      .select('nombre')
      .eq('id', idRol)
      .maybeSingle();
    throwOnError(result.error);
    const nombre = (result.data as { nombre?: string } | null)?.nombre;
    if (nombre !== expected) {
      throw new ForbiddenException(`El usuario debe tener rol ${expected}`);
    }
  }

  async create(dto: CreateUsuarioDto) {
    const idEstado = dto.idEstado ?? (await this.findEstadoIdByNombre(ESTADO.ACTIVO));
    const { data: authData, error: authError } =
      await this.supabase.admin.auth.admin.createUser({
        email: dto.email,
        password: dto.contrasena,
        email_confirm: true,
        user_metadata: { usuario: dto.usuario },
      });
    if (authError || !authData.user) {
      throw new ForbiddenException(authError?.message ?? 'No se pudo crear la cuenta');
    }

    const insert = await this.supabase
      .from('usuario')
      .insert({
        auth_id: authData.user.id,
        identificacion: dto.identificacion,
        usuario: dto.usuario,
        contrasena: 'managed-by-supabase',
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        id_estado: idEstado,
        id_rol: dto.idRol,
      })
      .select('id')
      .single();

    if (insert.error) {
      await this.supabase.admin.auth.admin.deleteUser(authData.user.id);
      throwOnError(insert.error);
    }

    return this.findById((insert.data as { id: number }).id);
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    const current = await this.findRowById(id);
    const patch: Record<string, unknown> = {
      fecha_ultima_modificacion: new Date().toISOString(),
    };
    if (dto.identificacion) patch.identificacion = dto.identificacion;
    if (dto.usuario) patch.usuario = dto.usuario;
    if (dto.nombre) patch.nombre = dto.nombre;
    if (dto.apellido) patch.apellido = dto.apellido;
    if (dto.email) patch.email = dto.email;
    if (dto.idRol) patch.id_rol = dto.idRol;
    if (dto.idEstado) patch.id_estado = dto.idEstado;

    const result = await this.supabase.from('usuario').update(patch).eq('id', id);
    throwOnError(result.error);

    if ((dto.email || dto.contrasena) && current.auth_id) {
      const authPatch: { email?: string; password?: string } = {};
      if (dto.email) authPatch.email = dto.email;
      if (dto.contrasena) authPatch.password = dto.contrasena;
      const { error } = await this.supabase.admin.auth.admin.updateUserById(
        current.auth_id,
        authPatch,
      );
      if (error) throw new ForbiddenException(error.message);
    }

    return this.findById(id);
  }

  async toAuthUser(row: UsuarioRow) {
    return toAuthUser(row);
  }

  async createBootstrapAdmin(dto: Omit<CreateUsuarioDto, 'idRol'>) {
    const count = await this.countAll();
    if (count > 0) {
      throw new ForbiddenException('El sistema ya tiene usuarios. Use el registro autenticado.');
    }
    const idRol = await this.findRolIdByNombre(ROLE.ADMINISTRADOR);
    return this.create({ ...dto, idRol });
  }
}
