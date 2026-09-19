import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION } from '../common/constants';
import { CreateMatriculaDto, ListMatriculasDto } from './dto/matricula.dto';
import { MatriculasService } from './matriculas.service';

@ApiTags('matriculas')
@ApiBearerAuth()
@Controller('matriculas')
export class MatriculasController {
  constructor(private readonly matriculas: MatriculasService) {}

  @Get()
  @RequirePermissions(PERMISSION.MATRICULA_VER)
  list(@Query() query: ListMatriculasDto) {
    return this.matriculas.list(query);
  }

  @Post()
  @RequirePermissions(PERMISSION.MATRICULA_CREAR)
  @Audit({ entidad: 'usuario_curso_vigencia', accion: 'Matriculó estudiante' })
  create(@Body() dto: CreateMatriculaDto) {
    return this.matriculas.create(dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION.MATRICULA_CREAR)
  @Audit({ entidad: 'usuario_curso_vigencia', accion: 'Eliminó matrícula' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matriculas.remove(id);
  }
}
