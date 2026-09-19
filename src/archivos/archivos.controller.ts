import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';
import { ArchivosService } from './archivos.service';

@ApiTags('archivos')
@ApiBearerAuth()
@Controller('archivos')
export class ArchivosController {
  constructor(private readonly archivos: ArchivosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        entidadTipo: { type: 'string' },
        entidadId: { type: 'number' },
        esConfidencial: { type: 'boolean' },
      },
    },
  })
  @Audit({ entidad: 'archivo', accion: 'Subió archivo' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('entidadTipo') entidadTipo: string,
    @Body('entidadId') entidadId: string,
    @Body('esConfidencial') esConfidencial: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.archivos.upload({
      file,
      entidadTipo,
      entidadId: Number(entidadId),
      esConfidencial: esConfidencial === 'true' || esConfidencial === '1',
      user,
    });
  }

  @Get(':id')
  download(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.archivos.download(id, user);
  }

  @Delete(':id')
  @Audit({ entidad: 'archivo', accion: 'Eliminó archivo' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.archivos.remove(id, user);
  }
}
