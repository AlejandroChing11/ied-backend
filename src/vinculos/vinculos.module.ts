import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { VinculosController } from './vinculos.controller';
import { VinculosService } from './vinculos.service';

@Module({
  imports: [UsuariosModule],
  controllers: [VinculosController],
  providers: [VinculosService],
  exports: [VinculosService],
})
export class VinculosModule {}
