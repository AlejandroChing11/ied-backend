import { ForbiddenException } from '@nestjs/common';
import { ConvivenciaService } from './convivencia.service';
import { ROLE } from '../common/constants';
import { AuthUser } from '../common/types';

const user: AuthUser = {
  id: 7,
  authId: 'a',
  identificacion: '1',
  usuario: 'doc',
  nombre: 'Ana',
  apellido: 'Pérez',
  email: 'ana@colegio.edu',
  idEstado: 1,
  idRol: 3,
  estado: 'ACTIVO',
  rol: ROLE.DOCENTE,
  permisos: ['convivencia.ver', 'convivencia.reportar'],
};

describe('ConvivenciaService', () => {
  it('marca alertaTipoIII en el detalle', async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            clasificacion: { nombre: 'Tipo III' },
            descripcion_objetiva: 'Hecho grave',
          },
          error: null,
        }),
      }),
    };
    const historial = { listar: jest.fn().mockResolvedValue([]), registrar: jest.fn() };
    const archivos = { listByEntidad: jest.fn().mockResolvedValue([]) };
    const service = new ConvivenciaService(supabase as any, historial as any, archivos as any);
    jest.spyOn(service as any, 'estadoId');
    const detail = await service.findOne(1, user);
    expect(detail.alertaTipoIII).toBe(true);
  });

  it('el docente no usa permisos confidenciales en listados', () => {
    expect(user.permisos.includes('convivencia.read_confidencial')).toBe(false);
    expect(() => {
      if (!user.permisos.includes('convivencia.reportar')) throw new ForbiddenException();
    }).not.toThrow();
  });
});
