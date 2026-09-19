import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCursoDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @IsNotEmpty()
  grado: string;
}

export class UpdateCursoDto {
  @IsString()
  @IsNotEmpty()
  grado: string;
}

export class CreateVigenciaDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;
}

export class UpdateVigenciaDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}

export class ListCursosDto {
  @IsOptional()
  @IsString()
  grado?: string;
}

export class ListVigenciasDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anio?: number;
}
