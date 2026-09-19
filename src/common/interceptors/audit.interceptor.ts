import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY } from '../constants';
import { AuditMeta } from '../decorators/audit.decorator';
import { AuthUser } from '../types';
import { AuditoriaService } from '../../auditoria/auditoria.service';

const METHOD_ACCION: Record<string, string> = {
  POST: 'Creó',
  PATCH: 'Actualizó',
  PUT: 'Actualizó',
  DELETE: 'Eliminó',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditoria: AuditoriaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      user?: AuthUser;
      params: Record<string, string>;
      body?: Record<string, unknown>;
    }>();

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
      return next.handle();
    }

    const meta = this.reflector.getAllAndOverride<AuditMeta | undefined>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      tap((response) => {
        const user = request.user;
        if (!user) return;
        const entidad = meta?.entidad;
        if (!entidad) return;

        const idEntidad = Number(
          request.params.id ??
            (response && typeof response === 'object' && 'id' in response
              ? (response as { id: number }).id
              : undefined),
        );

        const detalle = this.safeDetalle(request.body);
        void this.auditoria
          .registrar({
            idUsuario: user.id,
            accion: meta?.accion ?? METHOD_ACCION[request.method] ?? request.method,
            entidad,
            idEntidad: Number.isFinite(idEntidad) ? idEntidad : null,
            detalle,
          })
          .catch((error: unknown) => {
            this.logger.warn(
              `No se pudo registrar auditoría: ${error instanceof Error ? error.message : String(error)}`,
            );
          });
      }),
    );
  }

  private safeDetalle(body?: Record<string, unknown>) {
    if (!body) return null;
    const clone = { ...body };
    delete clone.contrasena;
    delete clone.password;
    const text = JSON.stringify(clone);
    return text.length > 250 ? text.slice(0, 247) + '...' : text;
  }
}
