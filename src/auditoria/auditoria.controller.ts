import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION } from '../common/constants';
import { AuditoriaService } from './auditoria.service';

class ListAuditoriaDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idUsuario?: number;

  @IsOptional()
  @IsString()
  entidad?: string;

  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  hasta?: string;
}

@ApiTags('auditoria')
@ApiBearerAuth()
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  @RequirePermissions(PERMISSION.AUDITORIA_VER)
  list(@Query() query: ListAuditoriaDto) {
    return this.auditoria.list({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      idUsuario: query.idUsuario,
      entidad: query.entidad,
      desde: query.desde,
      hasta: query.hasta,
    });
  }
}
