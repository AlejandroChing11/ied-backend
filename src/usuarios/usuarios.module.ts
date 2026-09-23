import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { CargaMasivaController } from './carga-masiva.controller';
import { CargaMasivaService } from './carga-masiva.service';

@Module({
  controllers: [UsuariosController, CargaMasivaController],
  providers: [UsuariosService, CargaMasivaService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
