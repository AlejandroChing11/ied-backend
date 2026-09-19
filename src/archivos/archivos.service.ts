import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../config/supabase.service';
import { PERMISSION } from '../common/constants';
import { AuthUser, hasPermission } from '../common/types';
import { throwOnError } from '../common/supabase.util';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_BYTES = 8 * 1024 * 1024;

@Injectable()
export class ArchivosService {
  constructor(private readonly supabase: SupabaseService) {}

  async upload(params: {
    file: Express.Multer.File;
    entidadTipo: string;
    entidadId: number;
    esConfidencial: boolean;
    user: AuthUser;
  }) {
    if (!params.file) throw new BadRequestException('Archivo requerido');
    if (!ALLOWED_MIME.has(params.file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }
    if (params.file.size > MAX_BYTES) {
      throw new BadRequestException('El archivo supera 8 MB');
    }

    const bucket =
      params.entidadTipo === 'EXCUSA' ? 'excusas' : 'convivencia';
    const nombreTecnico = `${randomUUID()}-${params.file.originalname.replace(/\s+/g, '_')}`;
    const path = `${params.entidadId}/${nombreTecnico}`;

    const { error: storageError } = await this.supabase.admin.storage
      .from(bucket)
      .upload(path, params.file.buffer, {
        contentType: params.file.mimetype,
        upsert: false,
      });
    if (storageError) {
      throw new BadRequestException(storageError.message);
    }

    const { data, error } = await this.supabase
      .from('archivo')
      .insert({
        entidad_tipo: params.entidadTipo,
        entidad_id: params.entidadId,
        nombre_original: params.file.originalname,
        nombre_tecnico: nombreTecnico,
        ruta: `${bucket}/${path}`,
        es_confidencial: params.esConfidencial,
        id_usuario_carga: params.user.id,
      })
      .select()
      .single();
    throwOnError(error);
    return data;
  }

  async listByEntidad(entidadTipo: string, entidadId: number, user: AuthUser) {
    const { data, error } = await this.supabase
      .from('archivo')
      .select('*')
      .eq('entidad_tipo', entidadTipo)
      .eq('entidad_id', entidadId)
      .order('fecha_carga', { ascending: false });
    throwOnError(error);
    const canConfidential = hasPermission(user, PERMISSION.ARCHIVO_READ_CONFIDENCIAL);
    return ((data ?? []) as any[]).filter((row) => !row.es_confidencial || canConfidential);
  }

  async download(id: number, user: AuthUser) {
    const { data, error } = await this.supabase
      .from('archivo')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Archivo no encontrado');
    const row = data as any;
    if (row.es_confidencial && !hasPermission(user, PERMISSION.ARCHIVO_READ_CONFIDENCIAL)) {
      throw new ForbiddenException('No puede descargar archivos confidenciales');
    }
    const [bucket, ...rest] = String(row.ruta).split('/');
    const path = rest.join('/');
    const signed = await this.supabase.admin.storage
      .from(bucket)
      .createSignedUrl(path, 60);
    if (signed.error || !signed.data) {
      throw new BadRequestException(signed.error?.message ?? 'No se pudo firmar la descarga');
    }
    await this.supabase.from('auditoria').insert({
      id_usuario: user.id,
      accion: 'Descargó archivo',
      entidad: 'archivo',
      id_entidad: id,
      detalle: row.nombre_original,
    });
    return { url: signed.data.signedUrl, nombre: row.nombre_original };
  }

  async remove(id: number, user: AuthUser) {
    const { data, error } = await this.supabase
      .from('archivo')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    throwOnError(error);
    if (!data) throw new NotFoundException('Archivo no encontrado');
    const row = data as any;
    if (row.id_usuario_carga !== user.id && user.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenException('No puede eliminar este archivo');
    }
    const [bucket, ...rest] = String(row.ruta).split('/');
    await this.supabase.admin.storage.from(bucket).remove([rest.join('/')]);
    const del = await this.supabase.from('archivo').delete().eq('id', id);
    throwOnError(del.error);
    return { deleted: true };
  }
}
