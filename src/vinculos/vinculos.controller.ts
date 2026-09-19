import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PERMISSION, ROLE } from '../common/constants';
import { AuthUser } from '../common/types';
import { CreateVinculoDto, ListVinculosDto, UpdateVinculoDto } from './dto/vinculo.dto';
import { VinculosService } from './vinculos.service';

@ApiTags('vinculos')
@ApiBearerAuth()
@Controller()
export class VinculosController {
  constructor(private readonly vinculos: VinculosService) {}

  @Get('vinculos')
  @RequirePermissions(PERMISSION.VINCULO_VER)
  list(@Query() query: ListVinculosDto) {
    return this.vinculos.list(query);
  }

  @Post('vinculos')
  @RequirePermissions(PERMISSION.VINCULO_CREAR)
  @Audit({ entidad: 'acudiente_estudiante', accion: 'Creó vínculo' })
  create(@Body() dto: CreateVinculoDto) {
    return this.vinculos.create(dto);
  }

  @Patch('vinculos/:id')
  @RequirePermissions(PERMISSION.VINCULO_CREAR)
  @Audit({ entidad: 'acudiente_estudiante', accion: 'Actualizó vínculo' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVinculoDto) {
    return this.vinculos.update(id, dto);
  }

  @Delete('vinculos/:id')
  @RequirePermissions(PERMISSION.VINCULO_CREAR)
  @Audit({ entidad: 'acudiente_estudiante', accion: 'Eliminó vínculo' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vinculos.remove(id);
  }

  @Get('acudidos')
  @Roles(ROLE.ACUDIENTE, ROLE.ADMINISTRADOR)
  acudidos(@CurrentUser() user: AuthUser) {
    return this.vinculos.acudidos(user.id);
  }
}
