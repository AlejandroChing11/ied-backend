import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION } from '../common/constants';
import {
  CreateCursoDto,
  CreateVigenciaDto,
  ListCursosDto,
  ListVigenciasDto,
  UpdateCursoDto,
  UpdateVigenciaDto,
} from './dto/academico.dto';
import { AcademicoService } from './academico.service';

@ApiTags('academico')
@ApiBearerAuth()
@Controller()
export class AcademicoController {
  constructor(private readonly academico: AcademicoService) {}

  @Get('cursos')
  @RequirePermissions(PERMISSION.ACADEMICO_VER)
  listCursos(@Query() query: ListCursosDto) {
    return this.academico.listCursos(query);
  }

  @Post('cursos')
  @RequirePermissions(PERMISSION.ACADEMICO_GESTIONAR)
  @Audit({ entidad: 'curso', accion: 'Creó curso' })
  createCurso(@Body() dto: CreateCursoDto) {
    return this.academico.createCurso(dto);
  }

  @Patch('cursos/:id')
  @RequirePermissions(PERMISSION.ACADEMICO_GESTIONAR)
  @Audit({ entidad: 'curso', accion: 'Actualizó curso' })
  updateCurso(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCursoDto) {
    return this.academico.updateCurso(id, dto);
  }

  @Get('vigencias')
  @RequirePermissions(PERMISSION.ACADEMICO_VER)
  listVigencias(@Query() query: ListVigenciasDto) {
    return this.academico.listVigencias(query);
  }

  @Post('vigencias')
  @RequirePermissions(PERMISSION.ACADEMICO_GESTIONAR)
  @Audit({ entidad: 'vigencia', accion: 'Creó vigencia' })
  createVigencia(@Body() dto: CreateVigenciaDto) {
    return this.academico.createVigencia(dto);
  }

  @Patch('vigencias/:id')
  @RequirePermissions(PERMISSION.ACADEMICO_GESTIONAR)
  @Audit({ entidad: 'vigencia', accion: 'Actualizó vigencia' })
  updateVigencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVigenciaDto,
  ) {
    return this.academico.updateVigencia(id, dto);
  }
}
