import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION } from '../common/constants';
import { CreateUsuarioDto, ListUsuariosDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @RequirePermissions(PERMISSION.USUARIO_VER)
  list(@Query() query: ListUsuariosDto) {
    return this.usuarios.list(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSION.USUARIO_VER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarios.findById(id);
  }

  @Post()
  @RequirePermissions(PERMISSION.USUARIO_CREAR)
  @Audit({ entidad: 'usuario', accion: 'Creó usuario' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuarios.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION.USUARIO_EDITAR)
  @Audit({ entidad: 'usuario', accion: 'Actualizó usuario' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuarios.update(id, dto);
  }
}
