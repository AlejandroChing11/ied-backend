import { SetMetadata } from '@nestjs/common';
import { AUDIT_KEY } from '../constants';

export interface AuditMeta {
  entidad: string;
  accion?: string;
}

export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_KEY, meta);
