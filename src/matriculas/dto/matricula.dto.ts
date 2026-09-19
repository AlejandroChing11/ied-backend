import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateMatriculaDto {
  @IsInt()
  idCurso: number;

  @IsInt()
  idVigencia: number;

  @IsInt()
  idUsuario: number;
}

export class ListMatriculasDto extends PaginationDto {
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
