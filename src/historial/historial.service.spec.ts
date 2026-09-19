import { HistorialService } from './historial.service';

describe('HistorialService', () => {
  it('registra una transición de proceso', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    const supabase = { from: jest.fn().mockReturnValue({ insert }) };
    const service = new HistorialService(supabase as any);
    await service.registrar({
      entidadTipo: 'EXCUSA',
      entidadId: 1,
      idUsuario: 2,
      accion: 'RADICACION',
      observacion: 'EXC-2026-001',
    });
    expect(supabase.from).toHaveBeenCalledWith('historial_proceso');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'RADICACION', entidad_id: 1 }),
    );
  });
});
