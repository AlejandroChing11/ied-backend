import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION } from '../common/constants';
import { AuthUser } from '../common/types';
import {
  AddReportanteDto,
  CreateActuacionDto,
  CreateRemisionDto,
  CreateSituacionDto,
  ListConvivenciaDto,
  UpdateActuacionDto,
} from './dto/convivencia.dto';
import { ConvivenciaService } from './convivencia.service';

@ApiTags('convivencia')
@ApiBearerAuth()
@Controller('convivencia')
export class ConvivenciaController {
  constructor(private readonly convivencia: ConvivenciaService) {}

  @Get('clasificaciones')
  @RequirePermissions(PERMISSION.CONVIVENCIA_VER)
  clasificaciones() {
    return this.convivencia.listClasificaciones();
  }

  @Get()
  @RequirePermissions(PERMISSION.CONVIVENCIA_VER)
  list(@Query() query: ListConvivenciaDto) {
    return this.convivencia.list(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSION.CONVIVENCIA_VER)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.convivencia.findOne(id, user);
  }

  @Post()
  @RequirePermissions(PERMISSION.CONVIVENCIA_REPORTAR)
  @Audit({ entidad: 'situacion_convivencia', accion: 'Reportó convivencia' })
  create(@Body() dto: CreateSituacionDto, @CurrentUser() user: AuthUser) {
    return this.convivencia.create(dto, user);
  }

  @Post(':id/reportantes')
  @RequirePermissions(PERMISSION.CONVIVENCIA_REPORTAR)
  addReportante(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddReportanteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.convivencia.addReportante(id, dto, user);
  }

  @Post(':id/actuaciones')
  @RequirePermissions(PERMISSION.CONVIVENCIA_VER)
  @Audit({ entidad: 'situacion_convivencia', accion: 'Registró actuación' })
  addActuacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateActuacionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.convivencia.addActuacion(id, dto, user);
  }

  @Patch(':id/actuaciones/:aid')
  @RequirePermissions(PERMISSION.CONVIVENCIA_VER)
  updateActuacion(
    @Param('id', ParseIntPipe) id: number,
    @Param('aid', ParseIntPipe) aid: number,
    @Body() dto: UpdateActuacionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.convivencia.updateActuacion(id, aid, dto, user);
  }

  @Post(':id/remision')
  @RequirePermissions(PERMISSION.CONVIVENCIA_VER)
  @Audit({ entidad: 'remision_orientacion', accion: 'Generó remisión' })
  createRemision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateRemisionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.convivencia.createRemision(id, dto, user);
  }

  @Patch(':id/remision/:rid')
  @RequirePermissions(PERMISSION.CONVIVENCIA_VER)
  activarRemision(
    @Param('id', ParseIntPipe) id: number,
    @Param('rid', ParseIntPipe) rid: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.convivencia.activarRemision(id, rid, user);
  }
}
