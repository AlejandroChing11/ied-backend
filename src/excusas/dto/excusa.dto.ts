import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateExcusaDto {
  @IsInt()
  idEstudiante: number;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsString()
  @IsNotEmpty()
  motivoDescripcion: string;
}

export class UpdateExcusaDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  motivoDescripcion?: string;
}

export class ResolverExcusaDto {
  @IsInt()
  idMotivoResolucion: number;

  @IsString()
  @IsNotEmpty()
  observacionesRevision: string;

  @IsString()
  @IsNotEmpty()
  decision: 'Aprobada' | 'Rechazada';
}

export class ListExcusasDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idEstudiante?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idEstadoProceso?: number;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
