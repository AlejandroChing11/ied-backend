import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateAsignacionDto {
  @IsInt()
  idCurso: number;

  @IsInt()
  idVigencia: number;

  @IsInt()
  idUsuario: number;
}

export class ListAsignacionesDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idCurso?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idVigencia?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idUsuario?: number;
}
