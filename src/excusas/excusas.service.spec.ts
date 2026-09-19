import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExcusasService } from './excusas.service';
import { ESTADO_PROCESO, ROLE } from '../common/constants';
import { AuthUser } from '../common/types';

const user: AuthUser = {
  id: 10,
  authId: 'a',
  identificacion: '1',
  usuario: 'est',
  nombre: 'Mariana',
  apellido: 'Aguilar',
  email: 'mariana@est.edu',
  idEstado: 1,
  idRol: 4,
  estado: 'ACTIVO',
  rol: ROLE.ESTUDIANTE,
  permisos: ['excusa.ver', 'excusa.radicar'],
};

function chain(result: { data: any; error: any; count?: number }) {
  const q: any = {};
  for (const method of [
    'select',
    'eq',
    'in',
    'gte',
    'lte',
    'like',
    'order',
    'limit',
    'range',
    'insert',
    'update',
  ]) {
    q[method] = jest.fn().mockReturnValue(q);
  }
  q.maybeSingle = jest.fn().mockResolvedValue(result);
  q.single = jest.fn().mockResolvedValue(result);
  q.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return q;
}

describe('ExcusasService', () => {
  const from = jest.fn();
  const supabase = { from } as any;
  const configuracion = { getValor: jest.fn().mockResolvedValue('1') };
  const historial = { registrar: jest.fn(), listar: jest.fn().mockResolvedValue([]) };
  const archivos = { listByEntidad: jest.fn().mockResolvedValue([]) };
  let service: ExcusasService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExcusasService(supabase, configuracion as any, historial as any, archivos as any);
  });

  it('rechaza fechas invertidas al radicar', async () => {
    await expect(
      service.create(
        {
          idEstudiante: 10,
          fechaInicio: '2026-09-10',
          fechaFin: '2026-09-01',
          motivoDescripcion: 'Cita',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('un estudiante no radica excusas de otro', async () => {
    await expect(
      service.create(
        {
          idEstudiante: 99,
          fechaInicio: '2026-09-01',
          fechaFin: '2026-09-02',
          motivoDescripcion: 'Cita',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('impide editar fuera del plazo', async () => {
    const current = {
      id: 1,
      id_estudiante: 10,
      fecha_limite_edicion: '2020-01-01T00:00:00.000Z',
      estado_proceso: { nombre: ESTADO_PROCESO.RADICADA },
    };
    jest.spyOn(service, 'findOne').mockResolvedValue(current as any);
    await expect(
      service.update(1, { motivoDescripcion: 'nuevo' }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
