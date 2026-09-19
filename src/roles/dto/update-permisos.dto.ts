import { IsArray, IsInt } from 'class-validator';

export class UpdateRolPermisosDto {
  @IsArray()
  @IsInt({ each: true })
  permisoIds: number[];
}
