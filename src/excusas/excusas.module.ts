import { Module } from '@nestjs/common';
import { ArchivosModule } from '../archivos/archivos.module';
import { ExcusasController } from './excusas.controller';
import { ExcusasService } from './excusas.service';

@Module({
  imports: [ArchivosModule],
  controllers: [ExcusasController],
  providers: [ExcusasService],
  exports: [ExcusasService],
})
export class ExcusasModule {}
