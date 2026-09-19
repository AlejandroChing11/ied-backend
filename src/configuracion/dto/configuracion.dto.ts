import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateConfiguracionDto {
  @IsString()
  @IsNotEmpty()
  valor: string;
}
