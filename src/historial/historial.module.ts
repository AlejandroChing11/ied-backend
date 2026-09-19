import { Global, Module } from '@nestjs/common';
import { HistorialService } from './historial.service';

@Global()
@Module({
  providers: [HistorialService],
  exports: [HistorialService],
})
export class HistorialModule {}
