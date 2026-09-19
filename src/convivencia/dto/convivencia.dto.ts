import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateSituacionDto {
  @IsInt()
  idEstudiante: number;

  @IsDateString()
  fechaHora: string;

  @IsOptional()
  @IsString()
  lugar?: string;

  @IsString()
  @IsNotEmpty()
  descripcionObjetiva: string;

  @IsInt()
  idClasificacion: number;

  @IsOptional()
  @IsString()
  rolEnReporte?: string;
}

export class AddReportanteDto {
  @IsInt()
  idUsuarioReporta: number;

  @IsOptional()
  @IsString()
  rolEnReporte?: string;
}

export class CreateActuacionDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsInt()
  idResponsable: number;

  @IsOptional()
  @IsDateString()
  fechaCompromiso?: string;
}

export class UpdateActuacionDto {
  @IsOptional()
  @IsBoolean()
  cumplido?: boolean;

  @IsOptional()
  @IsDateString()
  fechaCumplimiento?: string;
}

export class CreateRemisionDto {
  @IsString()
  @IsNotEmpty()
  motivoAtencion: string;
}

export class ListConvivenciaDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idEstudiante?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idClasificacion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idEstadoProceso?: number;
}
