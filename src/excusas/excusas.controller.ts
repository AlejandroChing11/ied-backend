import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION } from '../common/constants';
import { AuthUser } from '../common/types';
import {
  CreateExcusaDto,
  ListExcusasDto,
  ResolverExcusaDto,
  UpdateExcusaDto,
} from './dto/excusa.dto';
import { ExcusasService } from './excusas.service';

@ApiTags('excusas')
@ApiBearerAuth()
@Controller('excusas')
export class ExcusasController {
  constructor(private readonly excusas: ExcusasService) {}

  @Get()
  @RequirePermissions(PERMISSION.EXCUSA_VER)
  list(@Query() query: ListExcusasDto, @CurrentUser() user: AuthUser) {
    return this.excusas.list(query, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSION.EXCUSA_VER)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.excusas.findOne(id, user);
  }

  @Post()
  @RequirePermissions(PERMISSION.EXCUSA_RADICAR)
  @Audit({ entidad: 'excusa', accion: 'Radicó excusa' })
  create(@Body() dto: CreateExcusaDto, @CurrentUser() user: AuthUser) {
    return this.excusas.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION.EXCUSA_RADICAR)
  @Audit({ entidad: 'excusa', accion: 'Editó excusa' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExcusaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.excusas.update(id, dto, user);
  }

  @Post(':id/resolver')
  @RequirePermissions(PERMISSION.EXCUSA_RESOLVER)
  @Audit({ entidad: 'excusa', accion: 'Resolvió excusa' })
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolverExcusaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.excusas.resolver(id, dto, user);
  }
}
