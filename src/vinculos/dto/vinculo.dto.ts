import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateVinculoDto {
  @IsInt()
  idAcudiente: number;

  @IsInt()
  idEstudiante: number;

  @IsOptional()
  @IsString()
  parentesco?: string;

  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}

export class UpdateVinculoDto {
  @IsOptional()
  @IsString()
  parentesco?: string;

  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}

export class ListVinculosDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idAcudiente?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idEstudiante?: number;
}
