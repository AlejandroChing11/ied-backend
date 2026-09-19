import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PERMISSION, ROLE } from '../common/constants';
import { AuthUser } from '../common/types';
import { CreateAsignacionDto, ListAsignacionesDto } from './dto/asignacion.dto';
import { AsignacionesService } from './asignaciones.service';

@ApiTags('asignaciones')
@ApiBearerAuth()
@Controller()
export class AsignacionesController {
  constructor(private readonly asignaciones: AsignacionesService) {}

  @Get('asignaciones')
  @RequirePermissions(PERMISSION.ASIGNACION_VER)
  list(@Query() query: ListAsignacionesDto) {
    return this.asignaciones.list(query);
  }

  @Post('asignaciones')
  @RequirePermissions(PERMISSION.ASIGNACION_CREAR)
  @Audit({ entidad: 'usuario_curso_vigencia', accion: 'Asignó docente' })
  create(@Body() dto: CreateAsignacionDto) {
    return this.asignaciones.create(dto);
  }

  @Delete('asignaciones/:id')
  @RequirePermissions(PERMISSION.ASIGNACION_CREAR)
  @Audit({ entidad: 'usuario_curso_vigencia', accion: 'Eliminó asignación' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asignaciones.remove(id);
  }

  @Get('mis-cursos')
  @Roles(ROLE.DOCENTE, ROLE.ADMINISTRADOR)
  misCursos(@CurrentUser() user: AuthUser) {
    return this.asignaciones.misCursos(user.id);
  }
}
