import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLE } from '../common/constants';
import { UpdateConfiguracionDto } from './dto/configuracion.dto';
import { ConfiguracionService } from './configuracion.service';

@ApiTags('configuracion')
@ApiBearerAuth()
@Controller('configuracion')
@Roles(ROLE.ADMINISTRADOR)
export class ConfiguracionController {
  constructor(private readonly configuracion: ConfiguracionService) {}

  @Get()
  list() {
    return this.configuracion.list();
  }

  @Patch(':id')
  @Audit({ entidad: 'configuracion', accion: 'Actualizó configuración' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateConfiguracionDto) {
    return this.configuracion.update(id, dto);
  }
}
