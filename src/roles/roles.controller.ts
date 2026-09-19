import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION } from '../common/constants';
import { UpdateRolPermisosDto } from './dto/update-permisos.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('roles')
  @RequirePermissions(PERMISSION.ROL_VER)
  listRoles() {
    return this.roles.listRoles();
  }

  @Get('roles/:id')
  @RequirePermissions(PERMISSION.ROL_VER)
  findRol(@Param('id', ParseIntPipe) id: number) {
    return this.roles.findRol(id);
  }

  @Get('permisos')
  @RequirePermissions(PERMISSION.ROL_VER)
  listPermisos() {
    return this.roles.listPermisos();
  }

  @Patch('roles/:id/permisos')
  @RequirePermissions(PERMISSION.ROL_ASIGNAR)
  @Audit({ entidad: 'rol', accion: 'Actualizó permisos' })
  updatePermisos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRolPermisosDto,
  ) {
    return this.roles.updatePermisos(id, dto);
  }
}
