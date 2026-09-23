import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { SupabaseModule } from './config/supabase.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { AcademicoModule } from './academico/academico.module';
import { MatriculasModule } from './matriculas/matriculas.module';
import { AsignacionesModule } from './asignaciones/asignaciones.module';
import { VinculosModule } from './vinculos/vinculos.module';
import { ExcusasModule } from './excusas/excusas.module';
import { ConvivenciaModule } from './convivencia/convivencia.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { ArchivosModule } from './archivos/archivos.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { HistorialModule } from './historial/historial.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validateEnv,
    }),
    SupabaseModule,
    HistorialModule,
    AuditoriaModule,
    ConfiguracionModule,
    UsuariosModule,
    AuthModule,
    RolesModule,
    AcademicoModule,
    MatriculasModule,
    AsignacionesModule,
    VinculosModule,
    ArchivosModule,
    ExcusasModule,
    ConvivenciaModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
