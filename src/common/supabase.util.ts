import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';
import { Paginated } from './types';

export function throwOnError(error: PostgrestError | null, fallback?: string) {
  if (!error) return;
  if (error.code === '23505') {
    throw new ConflictException(error.message);
  }
  if (error.code === '23503') {
    throw new BadRequestException('Referencia inválida: ' + error.message);
  }
  if (error.code === 'PGRST116') {
    throw new NotFoundException(fallback ?? 'Registro no encontrado');
  }
  throw new BadRequestException(error.message || fallback || 'Error de base de datos');
}

export function unwrap<T>(
  result: { data: T | null; error: PostgrestError | null },
  notFound = 'Registro no encontrado',
): T {
  throwOnError(result.error, notFound);
  if (result.data == null) {
    throw new NotFoundException(notFound);
  }
  return result.data;
}

export function unwrapList<T>(result: {
  data: T[] | null;
  error: PostgrestError | null;
}): T[] {
  throwOnError(result.error);
  return result.data ?? [];
}

export function paginateMeta(
  page: number,
  limit: number,
  total: number,
): Paginated<never>['meta'] {
  return {
    page,
    limit,
    total,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}

export function range(page: number, limit: number): [number, number] {
  const from = (page - 1) * limit;
  return [from, from + limit - 1];
}

export function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value == null) {
    throw new InternalServerErrorException(message);
  }
  return value;
}
