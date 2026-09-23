import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Audit } from '../common/decorators/audit.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION } from '../common/constants';
import { CargaMasivaService } from './carga-masiva.service';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class CargaMasivaController {
  constructor(private readonly carga: CargaMasivaService) {}

  @Post('carga-masiva')
  @RequirePermissions(PERMISSION.CARGA_CSV)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @Audit({ entidad: 'Importación', accion: 'Carga masiva CSV' })
  importar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo CSV requerido');
    return this.carga.importar(file.buffer);
  }
}
