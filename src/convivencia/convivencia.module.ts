import { Module } from '@nestjs/common';
import { ArchivosModule } from '../archivos/archivos.module';
import { ConvivenciaController } from './convivencia.controller';
import { ConvivenciaService } from './convivencia.service';

@Module({
  imports: [ArchivosModule],
  controllers: [ConvivenciaController],
  providers: [ConvivenciaService],
  exports: [ConvivenciaService],
})
export class ConvivenciaModule {}
